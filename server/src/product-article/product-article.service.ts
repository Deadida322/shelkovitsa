import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { Between, In, Like, Repository } from 'typeorm';
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
import { moveFilesToStatic } from 'src/helpers/storageHelper';
import * as moment from 'moment';
@Injectable()
export class ProductArticleService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,

		@InjectRepository(ProductArticle)
		private productArticleRepository: Repository<ProductArticle>,

		@InjectRepository(ProductColor)
		private ProductColorRepository: Repository<ProductColor>,

		@InjectRepository(ProductSize)
		private ProductSizeRepository: Repository<ProductSize>,

		@InjectRepository(ProductSubcategory)
		private ProductSubcategoryRepository: Repository<ProductSubcategory>
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
		let currentProductSize = undefined;
		if (payload.productSizeId) {
			filterProducts = p.products.filter(
				(el) => el.productSize.id == payload.productSizeId
			);
			currentProductSize = payload.productSizeId;
		}

		const res = convertToClass(FullProductArticleDto, p);

		const mappedColors = filterProducts.map((el) =>
			convertToClass(ProductColorDto, el.productColor)
		);
		res.productColors = filterDuplicateObjectById<ProductColorDto>(mappedColors);

		const mappedSizes = p.products.map((el) =>
			convertToClass(ProductSizeDto, el.productSize)
		);

		res.productSizes = filterDuplicateObjectById<ProductSizeDto>(mappedSizes);

		return { ...convertToJson(FullProductArticleDto, res), currentProductSize };
	}

	async getList(
		payload: GetProductArticleListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductArticleDto>> {
		// type commonKeys =  keyof GetListDto

		// type WherePayload =  Omit<GetProductDto, commonKeys> & BaseWhereType;
		// let wherePayload :WherePayload  = {
		// 	...payload
		// };
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
			wherePayload = { ...wherePayload, name: Like(payload.name) };
		}
		if (!isAdmin) {
			wherePayload = { ...baseProductWhere };
		}

		const [result, total] = await this.productArticleRepository.findAndCount({
			...getPaginateWhere(payload),
			where: wherePayload
		});

		return getPaginateResult(
			isAdmin ? ProductArticleAdminDto : ProductArticleDto,
			result,
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

	async createArticleProduct(
		createProductDto: CreateProductArticleDto,
		images?: File[]
	) {
		const payload = convertToClass(ProductArticle, createProductDto);

		//проверка и нахождение связанных сущностей
		const { productColorIds, productSizeIds, productSubcategoryId } =
			createProductDto;

		if (productSizeIds) {
			const productSizes = await this.ProductSizeRepository.find({
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
			const productColors = await this.ProductColorRepository.find({
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
			const productSubcategory = await this.ProductSubcategoryRepository.findOne({
				where: {
					...baseWhere,
					id: productSubcategoryId
				}
			});

			if (!productSubcategory) {
				throw new BadRequestException('Нет такой подкатегории');
			}
		}
		await moveFilesToStatic(images, 1);
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
		data.forEach(async (row) => {
			try {
				const product: ParseProductArticleDto = {
					article: row[1] ?? '',
					color: row[2] ?? '',
					size: row[3] ?? '',
					amount: Number(row[4] ?? -1),
					price: Number(row[5] ?? -1)
				};

				const values = Object.values(product);
				if (values.includes('') || values.includes(-1)) {
					errorRows.push(row.map((el) => String(el)));
				} else {
					product.article = String(product.article).trim();
					product.color = String(product.color).trim();
					product.size = String(product.size).trim();
					await this.parseArticleProduct(product);
				}
			} catch (err) {
				errorRows.push([String(err)]);
			}
		});
		if (errorRows.length) {
			const buffer = xlsx.build([
				{ name: 'myFirstSheet', data: errorRows, options: {} }
			]);

			return buffer;
		}
		return undefined;
	}

	private async parseArticleProduct(productDto: ParseProductArticleDto): Promise<void> {
		const { amount, article, color, price, size } = productDto;

		let productArticle = await this.productArticleRepository.findOne({
			where: {
				article
			}
		});
		if (!productArticle) {
			productArticle = await this.productArticleRepository.save({
				article,
				price
			});
		} else {
			await this.productArticleRepository.update(
				{ id: productArticle.id },
				{
					is_deleted: false
				}
			);
		}

		let existProduct = await this.productRepository.findOne({
			where: {
				productArticle: {
					article
				},
				productColor: {
					name: color
				},
				productSize: {
					name: size
				}
			}
		});

		if (existProduct) {
			await this.productRepository.update(
				{
					id: existProduct.id
				},
				{ is_deleted: false, amount }
			);
		} else {
			let productColor = await this.ProductColorRepository.findOne({
				where: {
					name: color
				}
			});
			if (!productColor) {
				productColor = await this.ProductColorRepository.save({
					name: color
				});
			} else {
				await this.ProductColorRepository.update(
					{
						id: productColor.id
					},
					{ is_deleted: false }
				);
			}
			//секция с парсингом размеров

			let productSize = await this.ProductSizeRepository.findOne({
				where: {
					name: size
				}
			});

			if (!productSize) {
				productSize = await this.ProductSizeRepository.save({
					name: size
				});
			} else {
				await this.ProductSizeRepository.update(
					{
						id: productSize.id
					},
					{ is_deleted: false }
				);
			}

			const productPayload = {
				amount,
				productColor,
				productSize,
				productArticle
			};

			existProduct = await this.productRepository.save(productPayload);
		}
	}

	async getPopulateList() {
		const prevDate = moment().subtract(1, 'months').toDate();

		const articles = await this.productArticleRepository
			.createQueryBuilder('product_article')
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
			.addGroupBy('product_article.id')
			.select(
				'product_article.id as id, product_article.id as name, product_article.description as description, product_article.article as article, product_article.price as price, count(order.id) as orderCount'
			)
			.orderBy('count(order.id)', 'DESC')
			.limit(3)
			.execute();

		return convertToJsonMany(ProductArticleDto, articles);
	}
}
