import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import {
	DataSource,
	EntityManager,
	FindOptionsWhere,
	ILike,
	In,
	LessThanOrEqual,
	MoreThanOrEqual,
	Between,
	Repository
} from 'typeorm';
import { filterDuplicateObjectById } from 'src/common/utils';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductSize } from 'src/db/entities/ProductSize';
import {
	convertToClass,
	convertToJson,
	convertToJsonMany
} from 'src/helpers/convertHelper';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { moveFileToStatic, removeFile } from 'src/helpers/storageHelper';
import { ProductColorDto } from 'src/product-color/dto/ProductColorDto';
import { ProductSizeDto } from 'src/product-size/dto/ProductSizeDto';
import { CommonImageDto } from './dto/CommonImageDto';
import { FullProductArticleAdminDto } from './dto/FullProductArticleAdminDto';
import { FullProductArticleDto } from './dto/FullProductArticleDto';
import { GetDetailProductArticleDto } from './dto/GetDetailProductArticleDto';
import { GetProductArticleListDto } from './dto/GetProductArticleListDto';
import { ProductArticleAdminDto } from './dto/ProductArticleAdminDto';
import { ProductArticleDto } from './dto/ProductArticleDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';
import { UploadImageDto } from './dto/UploadImageDto';
import { baseProductWhere } from './product-article.types';

@Injectable()
export class ProductArticleService {
	private readonly logger = new Logger(ProductArticleService.name);

	constructor(
		private readonly dataSource: DataSource,

		@InjectRepository(ProductArticle)
		private readonly productArticleRepository: Repository<ProductArticle>,

		@InjectRepository(ProductFile)
		private readonly productFileRepository: Repository<ProductFile>
	) {}

	/**
	 * Карточка артикула. Цвета — только те, что есть в выбранном размере (если он передан),
	 * размеры — все активные варианты, чтобы размер можно было сменить.
	 * Админ видит и неопубликованные, и архивные артикулы.
	 */
	async getProductArticle(
		productArticleId: number,
		isAdmin: boolean,
		payload: GetDetailProductArticleDto
	) {
		const article = await this.productArticleRepository.findOne({
			where: isAdmin
				? { id: productArticleId }
				: { id: productArticleId, ...baseProductWhere },
			withDeleted: isAdmin,
			relations: { productFiles: true }
		});
		if (!article) {
			throw new NotFoundException('Артикул продукта не найден');
		}

		const products = await this.activeProducts(this.dataSource.manager, article.id);
		const productsOfSize = payload.productSizeId
			? products.filter((p) => p.productSize.id === payload.productSizeId)
			: products;

		const dtoClass = isAdmin ? FullProductArticleAdminDto : FullProductArticleDto;
		const res = convertToClass(dtoClass, article);
		res.productColors = uniqueColors(productsOfSize);
		res.productSizes = uniqueSizes(products);

		return {
			...convertToJson(dtoClass, res),
			currentProductSize: payload.productSizeId
		};
	}

	async getList(
		payload: GetProductArticleListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductArticleDto>> {
		const where: FindOptionsWhere<ProductArticle> = isAdmin
			? {}
			: { ...baseProductWhere };

		if (payload.subcategoryId || payload.categoryId) {
			where.productSubcategory = {
				...(payload.subcategoryId ? { id: payload.subcategoryId } : {}),
				...(payload.categoryId
					? { productCategory: { id: payload.categoryId } }
					: {})
			};
		}

		if (payload.minPrice && payload.maxPrice) {
			where.price = Between(payload.minPrice, payload.maxPrice);
		} else if (payload.minPrice) {
			where.price = MoreThanOrEqual(payload.minPrice);
		} else if (payload.maxPrice) {
			where.price = LessThanOrEqual(payload.maxPrice);
		}

		const whereWithSearch = payload.query
			? (['article', 'name', 'description'] as const).map((field) => ({
					...where,
					[field]: ILike(`%${payload.query}%`)
				}))
			: where;

		const [result, total] = await this.productArticleRepository.findAndCount({
			...getPaginateWhere(payload),
			where: whereWithSearch,
			// в админке нужны и архивные артикулы
			withDeleted: isAdmin,
			relations: { productFiles: true },
			order: { id: 'ASC' }
		});

		return getPaginateResult(
			isAdmin ? ProductArticleAdminDto : ProductArticleDto,
			result.map((el) => ({
				...el,
				productFiles: el.productFiles.filter((file) => file.isLogo)
			})),
			total,
			{
				itemsPerPage: payload.itemsPerPage,
				page: payload.page
			}
		);
	}

	// Популярные за месяц опубликованные артикулы; если заказов не было — любые опубликованные
	async getPopulateList() {
		const takeCount = 3;
		const since = moment().subtract(1, 'months').toDate();

		const popular: { id: number; orderCount: string }[] =
			await this.productArticleRepository
				.createQueryBuilder('product_article')
				.innerJoin('product_article.products', 'product')
				.innerJoin('product.orderProducts', 'orderProduct')
				.innerJoin('orderProduct.order', 'order')
				.where('order.created_at > :since', { since })
				.andWhere('product_article.isVisible = true')
				.groupBy('product_article.id')
				.select('product_article.id', 'id')
				.addSelect('count(order.id)', 'orderCount')
				.orderBy('count(order.id)', 'DESC')
				.limit(takeCount)
				.getRawMany();

		const articleIds = popular.length
			? popular.map((item) => item.id)
			: (
					await this.productArticleRepository.find({
						where: baseProductWhere,
						select: ['id'],
						order: { id: 'ASC' },
						take: takeCount
					})
				).map((item) => item.id);

		if (!articleIds.length) {
			return [];
		}

		const articles = await this.productArticleRepository.find({
			where: { id: In(articleIds), ...baseProductWhere },
			relations: { productFiles: true }
		});
		const rank = (id: number) => articleIds.indexOf(id);
		articles.sort((a, b) => rank(a.id) - rank(b.id));

		return convertToJsonMany(ProductArticleDto, articles);
	}

	async uploadImage(payload: UploadImageDto) {
		const productArticle = await this.productArticleRepository.findOne({
			where: { id: Number(payload.productArticleId) },
			withDeleted: true,
			relations: { productFiles: true }
		});
		if (!productArticle) {
			throw new NotFoundException('Не найдено такого продукта');
		}

		const name = await moveFileToStatic(payload.image);
		await this.productFileRepository.save({
			name,
			isLogo: productArticle.productFiles.length === 0,
			productArticle
		});
	}

	// Удаление фото; если удалили логотип — логотипом становится самое старое из оставшихся
	async deleteImage(payload: CommonImageDto) {
		const file = await this.productFileRepository.findOne({
			where: { id: payload.productFileId },
			relations: { productArticle: true }
		});
		if (!file) {
			throw new NotFoundException('Не найдено такого файла');
		}

		await this.dataSource.transaction(async (manager) => {
			await manager.delete(ProductFile, file.id);
			if (file.isLogo) {
				const next = await manager.findOne(ProductFile, {
					where: { productArticle: { id: file.productArticle.id } },
					order: { id: 'ASC' }
				});
				if (next) {
					await manager.update(ProductFile, next.id, { isLogo: true });
				}
			}
		});

		await removeFile(file.name).catch((error) =>
			this.logger.warn(
				`Не удалось удалить файл ${file.name}: ${error?.message ?? error}`
			)
		);
	}

	async changeLogo(payload: CommonImageDto) {
		const file = await this.productFileRepository.findOne({
			where: { id: payload.productFileId },
			relations: { productArticle: true }
		});
		if (!file) {
			throw new NotFoundException('Не найдено такого файла');
		}

		await this.dataSource.transaction(async (manager) => {
			await manager.update(
				ProductFile,
				{ productArticle: { id: file.productArticle.id } },
				{ isLogo: false }
			);
			await manager.update(ProductFile, file.id, { isLogo: true });
		});
	}

	/**
	 * Правка артикула в админке. Всё в одной транзакции: если артикул нельзя
	 * опубликовать, ни одно изменение не сохраняется.
	 */
	async updateProductArticle(payload: UpdateProductArticleDto) {
		await this.dataSource.transaction(async (manager) => {
			const article = await manager.findOne(ProductArticle, {
				where: { id: payload.id },
				withDeleted: true
			});
			if (!article) {
				throw new NotFoundException('Не найден такой артикул!');
			}

			if (payload.productColorIds || payload.productSizeIds) {
				await this.syncVariants(manager, article, payload);
			}

			const fields: Partial<ProductArticle> = {};
			if (payload.name !== undefined) fields.name = payload.name;
			if (payload.description !== undefined)
				fields.description = payload.description;
			if (payload.isVisible !== undefined) fields.isVisible = payload.isVisible;
			if (payload.is_deleted === true) fields.isVisible = false;
			if (Object.keys(fields).length) {
				await manager.update(ProductArticle, article.id, fields);
			}

			if (payload.is_deleted === true) {
				await manager.softDelete(ProductArticle, article.id);
			} else if (payload.is_deleted === false) {
				await manager.restore(ProductArticle, article.id);
			}

			await this.assertPublishable(manager, article.id);
		});

		return this.getProductArticle(payload.id, true, {} as GetDetailProductArticleDto);
	}

	/**
	 * Варианты = все сочетания выбранных цветов и размеров. Лишние уходят в архив
	 * (на них могут ссылаться заказы), вернувшиеся восстанавливаются с прежним остатком,
	 * новые создаются с остатком 0.
	 */
	private async syncVariants(
		manager: EntityManager,
		article: ProductArticle,
		payload: UpdateProductArticleDto
	) {
		const all = await manager.find(Product, {
			where: { productArticle: { id: article.id } },
			withDeleted: true
		});
		const active = all.filter((p) => !p.deleted_at);

		const colorIds = [
			...new Set(payload.productColorIds ?? active.map((p) => p.productColor.id))
		];
		const sizeIds = [
			...new Set(payload.productSizeIds ?? active.map((p) => p.productSize.id))
		];

		const colors = await manager.find(ProductColor, { where: { id: In(colorIds) } });
		const sizes = await manager.find(ProductSize, { where: { id: In(sizeIds) } });
		const missingColor = colorIds.find((id) => !colors.some((c) => c.id === id));
		if (missingColor) {
			throw new BadRequestException(`Цвет с ID ${missingColor} не найден`);
		}
		const missingSize = sizeIds.find((id) => !sizes.some((s) => s.id === id));
		if (missingSize) {
			throw new BadRequestException(`Размер с ID ${missingSize} не найден`);
		}

		const wanted = (p: Product) =>
			colorIds.includes(p.productColor.id) && sizeIds.includes(p.productSize.id);

		const toArchive = active.filter((p) => !wanted(p)).map((p) => p.id);
		const toRestore = all.filter((p) => p.deleted_at && wanted(p)).map((p) => p.id);
		if (toArchive.length) await manager.softDelete(Product, toArchive);
		if (toRestore.length) await manager.restore(Product, toRestore);

		const toCreate = colors.flatMap((productColor) =>
			sizes
				.filter(
					(productSize) =>
						!all.some(
							(p) =>
								p.productColor.id === productColor.id &&
								p.productSize.id === productSize.id
						)
				)
				.map((productSize) => ({
					productArticle: article,
					productColor,
					productSize,
					amount: 0
				}))
		);
		if (toCreate.length) await manager.save(Product, toCreate);
	}

	private async assertPublishable(manager: EntityManager, articleId: number) {
		const article = await manager.findOne(ProductArticle, {
			where: { id: articleId },
			relations: { productFiles: true }
		});
		// архивный артикул (findOne его не вернул) или скрытый — проверять нечего
		if (!article?.isVisible) {
			return;
		}

		const reasons = [
			!article.name && 'отсутствует имя',
			!article.productFiles?.length && 'отсутствуют файлы',
			!article.productSubcategory?.id && 'отсутствует привязка к подкатегории',
			!(await this.activeProducts(manager, articleId)).length &&
				'отсутствуют цвета или размеры продукта'
		].filter(Boolean);
		if (reasons.length) {
			throw new BadRequestException(
				`Нельзя выводить продукт: ${reasons.join(', ')}`
			);
		}
	}

	private activeProducts(manager: EntityManager, articleId: number) {
		return manager.find(Product, {
			where: { productArticle: { id: articleId } },
			order: { id: 'ASC' }
		});
	}
}

function uniqueColors(products: Product[]) {
	return filterDuplicateObjectById(
		products.map((p) => convertToClass(ProductColorDto, p.productColor))
	);
}

function uniqueSizes(products: Product[]) {
	return filterDuplicateObjectById(
		products.map((p) => convertToClass(ProductSizeDto, p.productSize))
	);
}
