import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import {
	DataSource,
	EntityManager,
	FindOptionsOrder,
	FindOptionsWhere,
	ILike,
	In,
	IsNull,
	LessThanOrEqual,
	MoreThanOrEqual,
	Not,
	Between,
	Raw,
	Repository,
	SelectQueryBuilder,
	Brackets
} from 'typeorm';
import { filterDuplicateObjectById } from 'src/common/utils';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { ProductSize } from 'src/db/entities/ProductSize';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { uploadedImageKey } from 'src/helpers/storageHelper';
import { FILE_STORAGE, FileStorage } from 'src/storage/storage.types';
import { GetDetailProductArticleDto } from './dto/GetDetailProductArticleDto';
import { GetProductArticleFiltersDto } from './dto/GetProductArticleFiltersDto';
import { GetProductArticleListDto, ProductSort } from './dto/GetProductArticleListDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';
import { baseProductWhere } from './product-article.types';

// Порядок списка; id всегда в конце, чтобы страницы не «плавали» при равной цене.
// default (= популярность) обрабатывается отдельно в getList.
const LIST_ORDERS: Record<
	Exclude<ProductSort, 'default'>,
	FindOptionsOrder<ProductArticle>
> = {
	new: { id: 'DESC' },
	priceAsc: { price: 'ASC', id: 'ASC' },
	priceDesc: { price: 'DESC', id: 'ASC' }
};

// % и _ в поисковой строке — обычные символы, а не шаблон
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class ProductArticleService {
	private readonly logger = new Logger(ProductArticleService.name);

	constructor(
		private readonly dataSource: DataSource,

		@InjectRepository(ProductArticle)
		private readonly productArticleRepository: Repository<ProductArticle>,

		@InjectRepository(ProductFile)
		private readonly productFileRepository: Repository<ProductFile>,

		@Inject(FILE_STORAGE)
		private readonly storage: FileStorage
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

		// превью (isLogo) всегда первым — и в админке, и на карточке
		const productFiles = [...(article.productFiles ?? [])].sort(
			(a, b) => Number(b.isLogo) - Number(a.isLogo) || a.id - b.id
		);

		// сериализация — FullProductArticleDto / FullProductArticleAdminDto в контроллере
		return {
			...article,
			productFiles,
			productColors: filterDuplicateObjectById(
				productsOfSize.map((p) => p.productColor)
			),
			productSizes: filterDuplicateObjectById(products.map((p) => p.productSize)),
			currentProductSize: payload.productSizeId
		};
	}

	async getList(
		payload: GetProductArticleListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductArticle>> {
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

		// null/undefined нельзя отличать через truthy — 0 допустим как граница фильтра
		if (payload.minPrice != null && payload.maxPrice != null) {
			where.price = Between(payload.minPrice, payload.maxPrice);
		} else if (payload.minPrice != null) {
			where.price = MoreThanOrEqual(payload.minPrice);
		} else if (payload.maxPrice != null) {
			where.price = LessThanOrEqual(payload.maxPrice);
		}

		// Остальные условия — подзапросы по варианту/фото/бренду. Они собираются в один Raw
		// на колонке id: у where один ключ на колонку, а поиск ниже ветвит условие по полям.
		const conditions = this.listConditions(payload, isAdmin);
		if (conditions.length) {
			const params = Object.assign({}, ...conditions.map((c) => c.params));
			where.id = Raw(
				(id) => conditions.map((c) => `(${c.sql(id)})`).join(' AND '),
				params
			);
		}

		if (isAdmin) {
			if (payload.status === 'archive') {
				where.deleted_at = Not(IsNull());
			} else if (payload.status === 'active') {
				where.deleted_at = IsNull();
			} else if (payload.status === 'published' || payload.status === 'hidden') {
				where.deleted_at = IsNull();
				where.isVisible = payload.status === 'published';
			}
		}

		const query = payload.query?.trim();
		const whereWithSearch = query
			? (['article', 'name', 'description', 'brand'] as const).map((field) => ({
					...where,
					[field]: ILike(`%${escapeLike(query)}%`)
				}))
			: where;

		const sort = payload.sort ?? 'default';
		const { take, skip } = getPaginateWhere(payload);

		let result: ProductArticle[];
		let total: number;

		if (sort === 'default') {
			// По популярности: заказы за месяц desc, без заказов — в конец по id
			const matched = await this.productArticleRepository.find({
				where: whereWithSearch,
				select: ['id'],
				withDeleted: isAdmin
			});
			total = matched.length;
			const ids = matched.map((row) => row.id);
			const pageIds = ids.length
				? await this.orderIdsByPopularity(ids, skip, take)
				: [];
			const rows = pageIds.length
				? await this.productArticleRepository.find({
						where: { id: In(pageIds) },
						withDeleted: isAdmin,
						relations: { productFiles: true }
					})
				: [];
			const byId = new Map(rows.map((row) => [row.id, row]));
			result = pageIds
				.map((id) => byId.get(id))
				.filter((row): row is ProductArticle => row != null);
		} else {
			[result, total] = await this.productArticleRepository.findAndCount({
				take,
				skip,
				where: whereWithSearch,
				withDeleted: isAdmin,
				relations: { productFiles: true },
				order: LIST_ORDERS[sort]
			});
		}

		const amounts = isAdmin
			? await this.totalAmounts(result.map((el) => el.id))
			: new Map<number, number>();

		return getPaginateResult(
			result.map((el) => ({
				...el,
				productFiles: el.productFiles.filter((file) => file.isLogo),
				...(isAdmin ? { totalAmount: amounts.get(el.id) ?? 0 } : {})
			})),
			total,
			{
				itemsPerPage: payload.itemsPerPage,
				page: payload.page
			}
		);
	}

	/** id артикулов: сначала с заказами за месяц (desc), затем остальные по id */
	private async orderIdsByPopularity(
		ids: number[],
		skip: number,
		take: number
	): Promise<number[]> {
		if (!ids.length) {
			return [];
		}
		const since = moment().subtract(1, 'months').toDate();
		const popular: { id: number; orderCount: string }[] =
			await this.productArticleRepository
				.createQueryBuilder('product_article')
				.innerJoin('product_article.products', 'product')
				.innerJoin('product.orderProducts', 'orderProduct')
				.innerJoin('orderProduct.order', 'order')
				.where('product_article.id IN (:...ids)', { ids })
				.andWhere('order.created_at > :since', { since })
				.groupBy('product_article.id')
				.select('product_article.id', 'id')
				.addSelect('count(order.id)', 'orderCount')
				.orderBy('count(order.id)', 'DESC')
				.addOrderBy('product_article.id', 'ASC')
				.getRawMany();

		const popularIds = popular.map((row) => Number(row.id));
		const popularSet = new Set(popularIds);
		const rest = ids
			.filter((id) => !popularSet.has(id))
			.sort((a, b) => a - b);
		return [...popularIds, ...rest].slice(skip, skip + take);
	}

	/**
	 * Условия списка, которые не выражаются полями артикула. `sql` получает выражение
	 * id артикула ("ProductArticle"."id") и возвращает SQL подзапроса; живые варианты —
	 * без мягко удалённых.
	 */
	private listConditions(payload: GetProductArticleListDto, isAdmin: boolean) {
		const conditions: {
			sql: (id: string) => string;
			params: Record<string, unknown>;
		}[] = [];
		const inStock = (id: string, extra = '') =>
			`SELECT 1 FROM product p WHERE p."productArticleId" = ${id} ` +
			`AND p.deleted_at IS NULL AND p.amount > 0 ${extra}`;

		if (payload.brand?.length) {
			conditions.push({
				sql: (id) =>
					`EXISTS (SELECT 1 FROM product_article b WHERE b.id = ${id} ` +
					`AND LOWER(b.brand) IN (:...brandNames))`,
				params: { brandNames: payload.brand.map((b) => b.trim().toLowerCase()) }
			});
		}

		// размер имеет смысл только в наличии: покупателю не нужен 70B, которого нет
		if (payload.productSizeId?.length) {
			conditions.push({
				sql: (id) =>
					`EXISTS (${inStock(id, 'AND p."productSizeId" IN (:...sizeIds)')})`,
				params: { sizeIds: payload.productSizeId }
			});
		}

		if (isAdmin && payload.stock === 'with') {
			conditions.push({ sql: (id) => `EXISTS (${inStock(id)})`, params: {} });
		} else if (isAdmin && payload.stock === 'without') {
			conditions.push({ sql: (id) => `NOT EXISTS (${inStock(id)})`, params: {} });
		} else if (payload.inStock) {
			conditions.push({ sql: (id) => `EXISTS (${inStock(id)})`, params: {} });
		}

		if (isAdmin && payload.image === 'with') {
			conditions.push({
				sql: (id) =>
					`EXISTS (SELECT 1 FROM product_file f WHERE f."productArticleId" = ${id})`,
				params: {}
			});
		} else if (isAdmin && payload.image === 'without') {
			conditions.push({
				sql: (id) =>
					`NOT EXISTS (SELECT 1 FROM product_file f WHERE f."productArticleId" = ${id})`,
				params: {}
			});
		}

		return conditions;
	}

	// Суммарный остаток по живым вариантам для страницы админского списка
	private async totalAmounts(articleIds: number[]) {
		const amounts = new Map<number, number>();
		if (!articleIds.length) return amounts;

		const rows: { id: number; total: string }[] = await this.dataSource.query(
			`SELECT "productArticleId" AS id, SUM(amount) AS total FROM product
			 WHERE deleted_at IS NULL AND "productArticleId" = ANY($1)
			 GROUP BY "productArticleId"`,
			[articleIds]
		);
		rows.forEach((row) => amounts.set(Number(row.id), Number(row.total)));
		return amounts;
	}

	/**
	 * Значения для панели фильтров: бренды и размеры в наличии с количеством артикулов,
	 * диапазон цен. Счётчики учитывают пересечение выбранных фильтров; для каждого
	 * типа свой фильтр не применяется (иначе нельзя было бы переключить бренд/размер).
	 * Публично — только опубликованные, в админке — все живые (не в архиве).
	 */
	async getFilters(payload: GetProductArticleFiltersDto, isAdmin: boolean) {
		type OmitFacet = 'brand' | 'size' | 'price';
		const inStockSql = (alias: string, extra = '') =>
			`EXISTS (SELECT 1 FROM product p WHERE p."productArticleId" = ${alias}.id ` +
			`AND p.deleted_at IS NULL AND p.amount > 0 ${extra})`;

		const scoped = (
			qb: SelectQueryBuilder<ProductArticle>,
			omit?: OmitFacet,
			alias = 'a'
		) => {
			if (!isAdmin) qb.andWhere(`${alias}.isVisible = true`);
			if (payload.subcategoryId || payload.categoryId) {
				qb.innerJoin(`${alias}.productSubcategory`, 'sub').innerJoin(
					'sub.productCategory',
					'cat'
				);
				if (payload.subcategoryId) {
					qb.andWhere('sub.id = :subcategoryId', {
						subcategoryId: payload.subcategoryId
					});
				}
				if (payload.categoryId) {
					qb.andWhere('cat.id = :categoryId', {
						categoryId: payload.categoryId
					});
				}
			}
			const query = payload.query?.trim();
			if (query) {
				qb.andWhere(
					new Brackets((search) => {
						(['article', 'name', 'description', 'brand'] as const).forEach(
							(field) => search.orWhere(`${alias}.${field} ILIKE :search`)
						);
					}),
					{ search: `%${escapeLike(query)}%` }
				);
			}
			// бренд не сужает список брендов — иначе выбранный бренд «запирает» остальные
			if (omit !== 'brand' && payload.brand?.length) {
				qb.andWhere(`LOWER(${alias}.brand) IN (:...brandNames)`, {
					brandNames: payload.brand.map((b) => b.trim().toLowerCase())
				});
			}
			if (omit !== 'size' && payload.productSizeId?.length) {
				qb.andWhere(inStockSql(alias, 'AND p."productSizeId" IN (:...sizeIds)'), {
					sizeIds: payload.productSizeId
				});
			}
			if (omit !== 'price') {
				if (payload.minPrice != null) {
					qb.andWhere(`${alias}.price >= :minPrice`, {
						minPrice: payload.minPrice
					});
				}
				if (payload.maxPrice != null) {
					qb.andWhere(`${alias}.price <= :maxPrice`, {
						maxPrice: payload.maxPrice
					});
				}
			}
			if (payload.inStock) {
				qb.andWhere(inStockSql(alias));
			}
			return qb;
		};

		const brands: { name: string; count: string }[] = await scoped(
			this.productArticleRepository.createQueryBuilder('a'),
			'brand'
		)
			.andWhere('a.brand IS NOT NULL')
			.select('a.brand', 'name')
			.addSelect('COUNT(*)', 'count')
			.groupBy('a.brand')
			.orderBy('a.brand', 'ASC')
			.getRawMany();

		const sizes: { id: number; name: string; count: string }[] = await scoped(
			this.productArticleRepository
				.createQueryBuilder('a')
				.innerJoin('a.products', 'p', 'p.amount > 0 AND p.deleted_at IS NULL')
				.innerJoin('p.productSize', 'size'),
			'size'
		)
			.select('size.id', 'id')
			.addSelect('size.name', 'name')
			.addSelect('COUNT(DISTINCT a.id)', 'count')
			.groupBy('size.id')
			.addGroupBy('size.name')
			.getRawMany();

		const price: { min: string | null; max: string | null } | undefined =
			await scoped(this.productArticleRepository.createQueryBuilder('a'), 'price')
				.select('MIN(a.price)', 'min')
				.addSelect('MAX(a.price)', 'max')
				.getRawOne();

		return {
			brands: brands.map((b) => ({ name: b.name, count: Number(b.count) })),
			sizes: sizes
				.map((s) => ({ id: Number(s.id), name: s.name, count: Number(s.count) }))
				// 70A, 70B, 75A … затем 38, 40 … и буквенные — по возрастанию с учётом чисел
				.sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true })),
			price: { min: Number(price?.min ?? 0), max: Number(price?.max ?? 0) }
		};
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

		return articles;
	}

	async uploadImage(articleId: number, image: Express.Multer.File) {
		const productArticle = await this.productArticleRepository.findOne({
			where: { id: articleId },
			withDeleted: true,
			relations: { productFiles: true }
		});
		if (!productArticle) {
			throw new NotFoundException('Не найдено такого продукта');
		}

		const { key, contentType } = uploadedImageKey(image);
		await this.storage.save(key, image.buffer, contentType);
		await this.productFileRepository.save({
			name: key,
			isLogo: productArticle.productFiles.length === 0,
			productArticle
		});
	}

	// Удаление фото; если удалили логотип — логотипом становится самое старое из оставшихся
	async deleteImage(fileId: number) {
		const file = await this.productFileRepository.findOne({
			where: { id: fileId },
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

		await this.storage
			.delete(file.name)
			.catch((error) =>
				this.logger.warn(
					`Не удалось удалить файл ${file.name}: ${error?.message ?? error}`
				)
			);
	}

	async changeLogo(fileId: number) {
		const file = await this.productFileRepository.findOne({
			where: { id: fileId },
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
	async updateProductArticle(id: number, payload: UpdateProductArticleDto) {
		await this.dataSource.transaction(async (manager) => {
			const article = await manager.findOne(ProductArticle, {
				where: { id },
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
			if (payload.price !== undefined) fields.price = payload.price;
			if (payload.isVisible !== undefined) fields.isVisible = payload.isVisible;
			if (payload.productSubcategoryId !== undefined) {
				const productSubcategory = await manager.findOne(ProductSubcategory, {
					where: { id: payload.productSubcategoryId }
				});
				if (!productSubcategory) {
					throw new BadRequestException('Такая подкатегория не существует!');
				}
				fields.productSubcategory = productSubcategory;
			}
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

		return this.getProductArticle(id, true, {} as GetDetailProductArticleDto);
	}

	/**
	 * Полное удаление артикула вместе с вариантами и фото. Только если ни один вариант
	 * (включая архивные) не попадал в заказы — иначе артикул можно лишь отправить в архив.
	 */
	async deleteProductArticle(id: number) {
		const files = await this.dataSource.transaction(async (manager) => {
			const article = await manager.findOne(ProductArticle, {
				where: { id },
				withDeleted: true,
				relations: { productFiles: true }
			});
			if (!article) {
				throw new NotFoundException('Не найден такой артикул!');
			}

			// заказ блокирует те же строки (OrderService.create): параллельный заказ
			// не проскочит между проверкой и удалением
			await manager
				.createQueryBuilder(Product, 'product')
				.setLock('pessimistic_write')
				.withDeleted()
				.where('product.productArticleId = :id', { id })
				.getMany();

			const ordered = await manager.exists(OrderProduct, {
				where: { product: { productArticle: { id } } },
				withDeleted: true
			});
			if (ordered) {
				throw new BadRequestException(
					'Товар уже заказывали — его можно только отправить в архив'
				);
			}

			await manager.delete(Product, { productArticle: { id } });
			// фото удаляются каскадом (product_file.productArticleId ON DELETE CASCADE)
			await manager.delete(ProductArticle, id);
			return article.productFiles;
		});

		await Promise.all(
			files.map((file) =>
				this.storage
					.delete(file.name)
					.catch((error) =>
						this.logger.warn(
							`Не удалось удалить файл ${file.name}: ${error?.message ?? error}`
						)
					)
			)
		);
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
