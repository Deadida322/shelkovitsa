import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { baseWhere, filterDuplicateObjectById } from 'src/common/utils';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import {
	convertToClass,
	convertToJson,
	convertToJsonMany
} from 'src/helpers/convertHelper';
import { FullProductArticleDto } from 'src/product-article/dto/FullProductArticleDto';
import { ProductColorDto } from 'src/product-color/dto/ProductColorDto';
import { ProductSizeDto } from 'src/product-size/dto/ProductSizeDto';
import { Between, DataSource, ILike, In, Like, Repository } from 'typeorm';
import { GetDetailProductArticleDto } from './dto/GetDetailProductArticleDto';
import { baseProductWhere } from './product-article.types';
import { Product } from 'src/db/entities/Product';
import { GetProductArticleListDto } from './dto/GetProductArticleListDto';
import { ProductArticleDto } from './dto/ProductArticleDto';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { ProductArticleAdminDto } from './dto/ProductArticleAdminDto';
import { CreateProductArticleDto } from './dto/CreateProductArticleDto';
import { UploadProductArticleFileDto } from './dto/UploadProductArticleFileDto';
import * as xlsx from 'node-xlsx';
import { ParseProductArticleDto } from './dto/ParseProductArticleDto';
import * as moment from 'moment';
import { UploadImageDto } from './dto/UploadImageDto';
import {
	existsFile,
	getColorsPath,
	moveFileToStatic,
	removeFile
} from 'src/helpers/storageHelper';
import { ProductFile } from 'src/db/entities/ProductFile';
import { FullProductArticleAdminDto } from './dto/FullProductArticleAdminDto';
import { CommonImageDto } from './dto/CommonImageDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';

@Injectable()
export class ProductArticleService {
	constructor(
		private dataSource: DataSource,

		@InjectRepository(Product)
		private productRepository: Repository<Product>,

		@InjectRepository(ProductArticle)
		private productArticleRepository: Repository<ProductArticle>,

		@InjectRepository(ProductColor)
		private productColorRepository: Repository<ProductColor>,

		@InjectRepository(ProductSize)
		private productSizeRepository: Repository<ProductSize>,

		@InjectRepository(ProductSubcategory)
		private productSubcategoryRepository: Repository<ProductSubcategory>,

		@InjectRepository(ProductFile)
		private productFileRepository: Repository<ProductFile>
	) {}

	async getProductArticle(
		productArticleId: number,
		isAdmin: boolean,
		payload: GetDetailProductArticleDto
	) {
		let wherePayload = { id: productArticleId };
		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}
		const p = await this.productArticleRepository.findOne({
			where: wherePayload,
			relations: {
				products: true
			}
		});

		if (!p) {
			throw new NotFoundException('Артикул продукта не найден');
		}
		let filterProducts = p.products;

		if (!isAdmin) {
			filterProducts = filterProducts.filter(
				(product) =>
					!product.productColor.is_deleted && !product.productSize.is_deleted
			);
		}
		let currentProductSize = undefined;
		if (payload.productSizeId) {
			filterProducts = p.products.filter(
				(el) => el.productSize.id == payload.productSizeId
			);
			currentProductSize = payload.productSizeId;
		}

		const res = convertToClass(
			isAdmin ? FullProductArticleAdminDto : FullProductArticleDto,
			p
		);

		const mappedColors = filterProducts.map((el) =>
			convertToClass(ProductColorDto, el.productColor)
		);
		res.productColors = filterDuplicateObjectById<ProductColorDto>(mappedColors);

		const mappedSizes = p.products.map((el) =>
			convertToClass(ProductSizeDto, el.productSize)
		);

		res.productSizes = filterDuplicateObjectById<ProductSizeDto>(mappedSizes);

		return {
			...convertToJson(
				isAdmin ? FullProductArticleAdminDto : FullProductArticleDto,
				res
			),
			currentProductSize
		};
	}

	async getList(
		payload: GetProductArticleListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductArticleDto>> {
		let wherePayload = {};

		if (payload.subcategoryId) {
			wherePayload = {
				...wherePayload,
				productSubcategory: {
					id: payload.subcategoryId
				}
			};
		}

		if (payload.categoryId) {
			wherePayload = {
				...wherePayload,
				productSubcategory: {
					productCategory: {
						id: payload.categoryId
					}
				}
			};
		}
		if (payload.minPrice || payload.maxPrice) {
			wherePayload = {
				...wherePayload,
				price: Between(
					payload.minPrice ?? 0,
					payload.maxPrice ?? Number.MAX_VALUE
				)
			};
		}
		if (payload.name) {
			wherePayload = { ...wherePayload, name: ILike(payload.name) };
		}
		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}

		const [result, total] = await this.productArticleRepository.findAndCount({
			...getPaginateWhere(payload),
			where: wherePayload
		});

		return getPaginateResult(
			isAdmin ? ProductArticleAdminDto : ProductArticleDto,
			result.map((el) => {
				return {
					...el,
					productFiles: el.productFiles.filter(
						(file) => file.isLogo && !file.is_deleted
					)
				};
			}),
			total,
			{
				itemsPerPage: payload.itemsPerPage,
				page: payload.page
			}
		);
	}

	private async clearArticleProducts() {
		await this.productRepository.update(
			{},
			{
				is_deleted: true
			}
		);
		await this.productArticleRepository.update(
			{},
			{
				is_deleted: true
			}
		);
	}

	//!!!! TODO недоделано
	async createArticleProduct(
		createProductDto: CreateProductArticleDto,
		images?: File[]
	) {
		const payload = convertToClass(ProductArticle, createProductDto);

		//проверка и нахождение связанных сущностей
		const { productColorIds, productSizeIds, productSubcategoryId } =
			createProductDto;

		if (productSizeIds) {
			const productSizes = await this.productSizeRepository.find({
				where: {
					...baseWhere,
					id: In(productSizeIds ?? [])
				}
			});
			if (productSizes.length != productSizeIds.length) {
				throw new BadRequestException('Нет такого размера');
			}
		}

		if (productColorIds) {
			const productColors = await this.productColorRepository.find({
				where: {
					...baseWhere,
					id: In(productColorIds ?? [])
				}
			});
			if (productColors.length != productColorIds.length) {
				throw new BadRequestException('Нет такого цвета');
			}
		}

		if (productSubcategoryId) {
			const productSubcategory = await this.productSubcategoryRepository.findOne({
				where: {
					...baseWhere,
					id: productSubcategoryId
				}
			});

			if (!productSubcategory) {
				throw new BadRequestException('Нет такой подкатегории');
			}
		}
		// const productFiles = await this.productArticleRepository.save([]);

		// const p = await this.productArticleRepository.save();
		// if (!p) {
		// 	throw new NotFoundException('Продукт не найден');
		// }
		// return convertToJson(FullProductDto, p);
	}

	async parseExcelFile(
		filePath: string,
		uploadFileDto: UploadProductArticleFileDto
	): Promise<Buffer | undefined> {
		const workSheetsFromFile = xlsx.parse(filePath);
		const data = workSheetsFromFile[0].data;

		if (uploadFileDto.isDeletedOther) {
			await this.clearArticleProducts();
		}
		const errorRows: string[][] = [];
		const colorMap = await this.getColorMap();
		let index = 0;
		for (const row of data) {
			try {
				if (index !== 0) {
					const product: ParseProductArticleDto = {
						article: row[13] ?? '',
						color: {
							name: row[4] ?? '',
							url: row[5] ?? ''
						},
						size: row[6] ?? '',
						amount: Number(row[18] ?? -1),
						price: Number(row[7] ?? -1),
						country: row[9] ?? '',
						description: row[10] ?? ''
					};

					// !!! TODO переделать функцию валидации
					const values = Object.values(product);
					if (values.filter((el) => !!el).length === 0) {
					} else if (values.includes('') || values.includes(-1)) {
						errorRows.push([
							...row,
							'',
							'В строке пустые или отрицательные значения'
						]);
					} else {
						console.log(JSON.stringify(product));
						product.article = String(product.article).trim();
						product.color.name = capitalizeFirstLetter(
							String(product.color.name).trim()
						);
						product.size = String(product.size).trim();
						await this.parseArticleProduct(product, colorMap);
					}
				}
			} catch (err) {
				const errRow = [...row, '', `Строка ${index + 1}: `, String(err)];
				errorRows.push(errRow);
			} finally {
				index++;
			}
		}

		if (errorRows.length > 0) {
			const buffer = xlsx.build([{ name: 'Ошибки', data: errorRows, options: {} }]);

			return buffer;
		}
		return undefined;
	}

	private async getColorMap(): Promise<Map<string, string>> {
		const colorsPath = await getColorsPath();
		const workSheetsFromFile = xlsx.parse(colorsPath);
		const data = workSheetsFromFile[1].data;

		const colorMap = new Map();
		data.forEach((el) => {
			const firstEl = String(el[0]).trim();
			const secondEl = String(el[1]).trim();
			if (firstEl && secondEl) {
				colorMap.set(
					capitalizeFirstLetter(firstEl),
					capitalizeFirstLetter(secondEl)
				);
			}
		});
		return colorMap;
	}

	private async parseArticleProduct(
		productDto: ParseProductArticleDto,
		colorMap: Map<string, string>
	): Promise<void> {
		const { amount, article, color, price, size, country } = productDto;

		const mappedColor = colorMap.get(color.name);
		if (!mappedColor) {
			throw new Error(`Нет такого цвета в файле преобразования`);
		}

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			const productArticleRepository =
				queryRunner.manager.getRepository(ProductArticle);
			let productArticle = await productArticleRepository.findOne({
				where: {
					article
				}
			});
			if (!productArticle) {
				productArticle = await productArticleRepository.save({
					article,
					price,
					country
				});
			} else {
				await productArticleRepository.update(
					{ id: productArticle.id },
					{
						price,
						is_deleted: false
					}
				);
			}

			const productColorRepository =
				queryRunner.manager.getRepository(ProductColor);
			const productColor = await productColorRepository.findOne({
				where: {
					name: mappedColor
				}
			});
			if (!productColor) {
				throw new Error(`В БД не найден такой цвет`);
			} else {
				await productColorRepository.update(
					{
						id: productColor.id,
						url: productColor.url
					},
					{ is_deleted: false }
				);
			}

			const productSizeRepository = queryRunner.manager.getRepository(ProductSize);

			let productSize = await productSizeRepository.findOne({
				where: {
					name: size
				}
			});

			if (!productSize) {
				productSize = await productSizeRepository.save({
					name: size
				});
			} else {
				await productSizeRepository.update(
					{
						id: productSize.id
					},
					{ is_deleted: false }
				);
			}

			const productRepository = queryRunner.manager.getRepository(Product);
			let existProduct = await productRepository.findOne({
				where: {
					productArticle: {
						article
					},
					productColor: {
						name: mappedColor
					},
					productSize: {
						name: size
					}
				}
			});

			if (existProduct) {
				await productRepository.update(
					{
						id: existProduct.id
					},
					{ is_deleted: false, amount }
				);
			} else {
				const productPayload = {
					amount,
					productColor,
					productSize,
					productArticle
				};

				await productRepository.save(productPayload);
			}

			await queryRunner.commitTransaction();
		} catch (err) {
			await queryRunner.rollbackTransaction();
			throw err;
		} finally {
			await queryRunner.release();
		}
	}

	// TODO допилить и обсудить
	async getPopulateList() {
		const prevDate = moment().subtract(1, 'months').toDate();

		const articles = await this.productArticleRepository
			.createQueryBuilder('product_article')
			// .leftJoinAndSelect('product_article.productFiles', 'product_file')
			.leftJoinAndSelect('product_article.products', 'product')
			.leftJoinAndSelect('product.orderProducts', 'orderProduct')
			.leftJoinAndSelect('orderProduct.order', 'order')
			.where('order.created_at > :createdAt', {
				createdAt: prevDate
			})
			.where(
				'product_article.isVisible = :isVisible AND product_article.is_deleted = :isDeleted',
				{
					isVisible: true,
					isDeleted: false
				}
			)
			.groupBy('product_article.id')
			.select([
				'product_article.id as id',
				'product_article.name as name',
				'product_article.country as country',
				'product_article.description as description',
				'product_article.article as article',
				'product_article.price as price',
				'count(order.id) as orderCount'
			])
			.orderBy('count(order.id)', 'DESC')
			.limit(3)
			.execute();

		console.log(articles);

		return convertToJsonMany(ProductArticleDto, articles);
	}

	async uploadImage(payload: UploadImageDto) {
		const productArticle = await this.productArticleRepository.findOne({
			where: {
				id: payload.productArticleId
			}
		});
		if (!productArticle) {
			throw new BadRequestException('Не найдено такого продукта');
		}
		const isLogo = productArticle.productFiles.length == 0;
		const image = await moveFileToStatic(payload.image);

		await this.productFileRepository.save({
			image,
			isLogo,
			product: productArticle
		});
	}

	async deleteImage(payload: CommonImageDto) {
		const file = await this.productFileRepository.findOne({
			where: {
				id: payload.productFileId
			}
		});

		if (!file) {
			throw new BadRequestException('Не найдено такого файла');
		}

		await removeFile(file.name);

		await this.productFileRepository.delete({
			id: file.id
		});
	}

	async changeLogo(payload: CommonImageDto) {
		const productArticle = await this.productArticleRepository.findOne({
			where: {
				productFiles: {
					id: payload.productFileId
				}
			},
			relations: {
				productFiles: true
			}
		});

		if (
			!productArticle ||
			!productArticle.productFiles ||
			!productArticle.productFiles.length
		) {
			throw new BadRequestException('Не найдено такого файла');
		}

		const productFiles = await this.productFileRepository.find({
			where: {
				product: {
					id: productArticle.id
				}
			}
		});
		await this.productFileRepository.update(
			productFiles.map((el) => el.id).filter((el) => el != payload.productFileId),
			{
				isLogo: false
			}
		);
		await this.productFileRepository.update(payload.productFileId, {
			isLogo: true
		});
	}

	async updateProductArticle(payload: UpdateProductArticleDto) {
		//удаляем все нулевые свойста у payload
		Object.keys(payload).forEach(
			(key) => payload[key] === undefined && delete payload[key]
		);

		const productArticle = await this.productArticleRepository.findOne({
			where: {
				id: payload.id
			},
			relations: {
				products: true
			}
		});
		if (!productArticle) {
			throw new BadRequestException('Не найден такой артикул!');
		}

		if (
			payload.isVisible &&
			typeof payload.isVisible == 'boolean' &&
			payload.isVisible
		) {
			if (!productArticle.name && !payload.name) {
				throw new BadRequestException('Нельзя выводить продукт, отсутствует имя');
			}

			const validFiles = productArticle.productFiles.filter((el) => !el.is_deleted);
			if (!validFiles || !validFiles.length) {
				throw new BadRequestException(
					'Нельзя выводить продукт, отсутствуют файлы'
				);
			}

			if (
				!productArticle.productSubcategory ||
				!productArticle.productSubcategory.id ||
				productArticle.productSubcategory.is_deleted
			) {
				throw new BadRequestException(
					'Нельзя выводить продукт, отсутствует привязка к подкатегории'
				);
			}

			const validProducts = productArticle.products.filter((el) => !el.is_deleted);
			if (!validProducts || !validProducts.length) {
				throw new BadRequestException(
					'Нельзя выводить продукт, отсутствуют цвета или размеры продукта'
				);
			}
		}

		const updateProductArticle = await this.productArticleRepository.save({
			...productArticle,
			...payload
		});

		const res = convertToClass(FullProductArticleAdminDto, updateProductArticle);

		const mappedColors = updateProductArticle.products.map((el) =>
			convertToClass(ProductColorDto, el.productColor)
		);
		res.productColors = filterDuplicateObjectById<ProductColorDto>(mappedColors);

		const mappedSizes = updateProductArticle.products.map((el) =>
			convertToClass(ProductSizeDto, el.productSize)
		);

		res.productSizes = filterDuplicateObjectById<ProductSizeDto>(mappedSizes);

		return convertToJson(FullProductArticleAdminDto, res);
	}
}
