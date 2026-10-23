import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { filterDuplicateObjectById } from 'src/common/utils';
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
import { Between, DataSource, ILike, In, Repository } from 'typeorm';
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
import * as moment from 'moment';
import { UploadImageDto } from './dto/UploadImageDto';
import { moveFileToStatic, removeFile } from 'src/helpers/storageHelper';
import { ProductFile } from 'src/db/entities/ProductFile';
import { FullProductArticleAdminDto } from './dto/FullProductArticleAdminDto';
import { CommonImageDto } from './dto/CommonImageDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';

@Injectable()
export class ProductArticleService {
	private readonly logger = new Logger(ProductArticleService.name);

	constructor(
		private readonly dataSource: DataSource,

		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,

		@InjectRepository(ProductArticle)
		private readonly productArticleRepository: Repository<ProductArticle>,

		@InjectRepository(ProductColor)
		private readonly productColorRepository: Repository<ProductColor>,

		@InjectRepository(ProductSize)
		private readonly productSizeRepository: Repository<ProductSize>,

		@InjectRepository(ProductSubcategory)
		private readonly productSubcategoryRepository: Repository<ProductSubcategory>,

		@InjectRepository(ProductFile)
		private readonly productFileRepository: Repository<ProductFile>
	) {}

	async getProductArticle(
		productArticleId: number,
		isAdmin: boolean,
		payload: GetDetailProductArticleDto
	) {
		let wherePayload = {
			id: productArticleId
		};
		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}
		const p = await this.productArticleRepository.findOne({
			where: wherePayload,
			relations: {
				products: true,
				productFiles: true
			}
		});

		if (!p) {
			throw new NotFoundException('Артикул продукта не найден');
		}
		let filterProducts = p.products.filter((el) => !el.is_deleted);

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

		const mappedSizes = filterProducts.map((el) =>
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

		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}

		if (payload.query) {
			wherePayload = [
				{
					...wherePayload,
					article: ILike(`%${payload.query}%`)
				},
				{
					...wherePayload,
					name: ILike(`%${payload.query}%`)
				},
				{
					...wherePayload,
					description: ILike(`%${payload.query}%`)
				}
			];
		}

		const [result, total] = await this.productArticleRepository.findAndCount({
			...getPaginateWhere(payload),
			where: wherePayload,
			relations: {
				productFiles: true
			}
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

	// TODO допилить и обсудить
	async getPopulateList() {
		const takeCount = 3;
		const prevDate = moment().subtract(1, 'months').toDate();

		// Сначала получаем ID популярных артикулов с заказами за последний месяц
		const popularArticleIds = await this.productArticleRepository
			.createQueryBuilder('product_article')
			.leftJoin('product_article.products', 'product')
			.leftJoin('product.orderProducts', 'orderProduct')
			.leftJoin('orderProduct.order', 'order')
			.where('order.created_at > :createdAt', {
				createdAt: prevDate
			})
			.andWhere(
				'product_article.isVisible = :isVisible AND product_article.is_deleted = :isDeleted',
				{
					isVisible: true,
					isDeleted: false
				}
			)
			.groupBy('product_article.id')
			.select('product_article.id', 'id')
			.addSelect('count(order.id)', 'orderCount')
			.orderBy('count(order.id)', 'DESC')
			.limit(takeCount)
			.execute();

		let articleIds: number[];

		if (popularArticleIds.length > 0) {
			// Если есть популярные продукты с заказами
			articleIds = popularArticleIds.map((item) => item.id);
		} else {
			// Если нет популярных продуктов, берем любые доступные
			const fallbackArticles = await this.productArticleRepository.find({
				where: {
					isVisible: true,
					is_deleted: false
				},
				select: ['id'],
				take: takeCount
			});
			articleIds = fallbackArticles.map((item) => item.id);
		}

		if (articleIds.length === 0) {
			return [];
		}

		// Получаем полные данные с файлами для выбранных артикулов
		const articles = await this.productArticleRepository.find({
			where: {
				id: In(articleIds),
				isVisible: true,
				is_deleted: false
			},
			relations: {
				productFiles: true,
				products: true
			}
		});

		// Сортируем по количеству заказов (если есть данные о заказах)
		const sortedArticles = articles.sort((a, b) => {
			if (popularArticleIds.length > 0) {
				const aCount =
					popularArticleIds.find((item) => item.id === a.id)?.orderCount || 0;
				const bCount =
					popularArticleIds.find((item) => item.id === b.id)?.orderCount || 0;
				return bCount - aCount;
			}
			// Если нет данных о заказах, сортируем по ID
			return a.id - b.id;
		});

		return convertToJsonMany(ProductArticleDto, sortedArticles);
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
		const name = await moveFileToStatic(payload.image);

		await this.productFileRepository.save({
			name,
			isLogo,
			productArticle
		});
	}

	async deleteImage(payload: CommonImageDto) {
		const file = await this.productFileRepository.findOne({
			where: {
				id: payload.productFileId
			}
		});

		if (!file) {
			throw new NotFoundException('Не найдено такого файла');
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

		if (!productArticle?.productFiles?.length) {
			throw new BadRequestException('Не найдено такого файла');
		}

		const productFiles = await this.productFileRepository.find({
			where: {
				productArticle: {
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

		if (payload.productColorIds || payload.productSizeIds) {
			const actualColors = Array.from(
				new Set(
					payload.productColorIds ??
						productArticle.products.map((product) => product.productColor.id)
				)
			);
			const actualSizes = Array.from(
				new Set(
					payload.productSizeIds ??
						productArticle.products.map((product) => product.productSize.id)
				)
			);

			await this.productRepository.update(
				{
					productArticle: {
						id: productArticle.id
					}
				},
				{ is_deleted: true }
			);

			const newProducts = [];
			const productsToRestore = [];
			const currentProducts = productArticle.products;

			for (const colorId of actualColors) {
				for (const sizeId of actualSizes) {
					// Проверяем, существует ли уже такая комбинация цвета и размера (активная)
					const existingProduct = currentProducts.find(
						(product) =>
							product.productColor?.id === colorId &&
							product.productSize?.id === sizeId
					);

					if (existingProduct) {
						productsToRestore.push(existingProduct);
						continue;
					}

					// Если комбинации нет вообще, создаем новый продукт
					// Проверяем существование цвета
					const existingColor = await this.productColorRepository.findOne({
						where: { id: colorId }
					});

					// Проверяем существование размера
					const existingSize = await this.productSizeRepository.findOne({
						where: { id: sizeId }
					});

					// Выбрасываем ошибки если не найдены цвет или размер
					if (!existingColor) {
						throw new BadRequestException(`Цвет с ID ${colorId} не найден`);
					}

					if (!existingSize) {
						throw new BadRequestException(`Размер с ID ${sizeId} не найден`);
					}

					const newProduct = this.productRepository.create({
						productArticle: productArticle,
						productColor: existingColor,
						productSize: existingSize,
						amount: 0 // По умолчанию количество 0
					});
					newProducts.push(newProduct);
				}
			}

			// Восстанавливаем удаленные продукты
			if (productsToRestore.length > 0) {
				await this.productRepository.update(
					{
						id: In(productsToRestore.map((p) => p.id))
					},
					{ is_deleted: false }
				);
			}

			// Создаем новые продукты
			if (newProducts.length > 0) {
				await this.productRepository.save(newProducts);
			}
		}

		// Обновляем основные поля продукта
		const updateData: Partial<ProductArticle> = {};
		if (payload.name !== undefined) updateData.name = payload.name;
		if (payload.description !== undefined)
			updateData.description = payload.description;
		if (payload.isVisible !== undefined) updateData.isVisible = payload.isVisible;
		if (payload.is_deleted !== undefined) updateData.is_deleted = payload.is_deleted;

		if (Object.keys(updateData).length > 0) {
			await this.productArticleRepository.update(payload.id, updateData);
		}

		// Получаем обновленный продукт с новыми связями
		// и без удаленных продуктов
		const updatedProductArticle = await this.productArticleRepository.findOne({
			where: {
				id: payload.id
			},
			relations: {
				products: {
					productColor: true,
					productSize: true
				}
			}
		});
		updatedProductArticle.products = updatedProductArticle.products.filter(
			(el) => !el.is_deleted
		);

		if (
			payload.isVisible &&
			typeof payload.isVisible == 'boolean' &&
			payload.isVisible
		) {
			if (!updatedProductArticle.name && !payload.name) {
				throw new BadRequestException('Нельзя выводить продукт, отсутствует имя');
			}

			const validFiles =
				updatedProductArticle.productFiles?.filter((el) => !el.is_deleted) || [];
			if (!validFiles?.length) {
				throw new BadRequestException(
					'Нельзя выводить продукт, отсутствуют файлы'
				);
			}

			if (
				!updatedProductArticle.productSubcategory?.id ||
				updatedProductArticle.productSubcategory.is_deleted
			) {
				throw new BadRequestException(
					'Нельзя выводить продукт, отсутствует привязка к подкатегории'
				);
			}

			const validProducts =
				updatedProductArticle.products?.filter((el) => !el.is_deleted) || [];
			if (!validProducts?.length) {
				throw new BadRequestException(
					'Нельзя выводить продукт, отсутствуют цвета или размеры продукта'
				);
			}
		}

		const res = convertToClass(FullProductArticleAdminDto, updatedProductArticle);

		const mappedColors = (updatedProductArticle?.products || []).map((el) =>
			convertToClass(ProductColorDto, el.productColor)
		);

		res.productColors = filterDuplicateObjectById<ProductColorDto>(mappedColors);

		const mappedSizes = (updatedProductArticle?.products || []).map((el) =>
			convertToClass(ProductSizeDto, el.productSize)
		);

		res.productSizes = filterDuplicateObjectById<ProductSizeDto>(mappedSizes);

		return convertToJson(FullProductArticleAdminDto, res);
	}
}
