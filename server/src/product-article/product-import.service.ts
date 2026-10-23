import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import * as xlsx from 'node-xlsx';
import { DataSource, EntityManager } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { downloadImage } from 'src/helpers/imageDownloadHelper';
import { FILE_STORAGE, FileStorage } from 'src/storage/storage.types';
import { getColorsPath, getSizesPath } from 'src/helpers/storageHelper';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import { ParseProductArticleDto } from './dto/ParseProductArticleDto';
import { UploadProductArticleFileDto } from './dto/UploadProductArticleFileDto';

// Номера колонок в выгрузке поставщика
const COLUMNS = {
	productCategory: 1,
	productSubcategory: 2,
	brand: 3,
	colorName: 4,
	colorUrl: 5,
	size: 6,
	price: 7,
	country: 9,
	description: 10,
	composition: 11,
	article: 13,
	imageUrls: 15,
	name: 16,
	amount: 18
} as const;

// Остаток у поставщика: число или «>5» (больше пяти) — берём гарантированный минимум
export function parseAmount(value: unknown): number {
	if (typeof value === 'number') {
		return Math.floor(value);
	}
	const text = String(value ?? '').trim();
	const atLeast = /^>\s*(\d+)$/.exec(text);
	return atLeast ? Number(atLeast[1]) : text === '' ? NaN : Number(text);
}

// Что нужно докачать после коммита строки: сеть не должна держать транзакцию
interface PendingImages {
	article: ProductArticle;
	color: ProductColor;
	colorUrl?: string;
	imageUrls: string[];
}

/**
 * Импорт каталога из Excel-выгрузки поставщика.
 * Каждая строка — вариант товара (артикул + цвет + размер) со своей транзакцией;
 * строки с ошибками возвращаются отдельным Excel-файлом.
 */
@Injectable()
export class ProductImportService {
	private readonly logger = new Logger(ProductImportService.name);

	constructor(
		private readonly dataSource: DataSource,
		@Inject(FILE_STORAGE) private readonly storage: FileStorage
	) {}

	// Скачать картинку поставщика и положить в хранилище; возвращает ключ (имя файла)
	private async downloadToStorage(url: string, prefix: string, name: string) {
		const image = await downloadImage(url, prefix, name);
		await this.storage.save(image.key, image.buffer, image.contentType);
		return image.key;
	}

	async importFromExcel(
		filePath: string,
		options: UploadProductArticleFileDto,
		// для быстрого сида без сети картинки можно не качать
		{ downloadImages = true }: { downloadImages?: boolean } = {}
	): Promise<Buffer> {
		let workSheetsFromFile: ReturnType<typeof xlsx.parse>;
		try {
			workSheetsFromFile = xlsx.parse(filePath);
		} catch (e) {
			throw new BadRequestException(
				`Не удалось открыть Excel: ${e instanceof Error ? e.message : String(e)}`
			);
		}
		const data = workSheetsFromFile?.[0]?.data as unknown[][];
		if (!data?.length) {
			throw new BadRequestException(
				'В файле нет данных на первом листе (пустой файл или неверный формат)'
			);
		}

		if (options.isDeletedOther) {
			await this.clearCatalog();
		}

		const colorMap = await this.getColorMap();
		const sizeMap = await this.getSizeMap();
		const errorRows: unknown[][] = [];

		for (let index = 0; index < data.length; index++) {
			const rowValues = Array.isArray(data[index]) ? data[index] : [];
			const isRowEmpty = rowValues.every(
				(value) =>
					value === undefined || value === null || String(value).trim() === ''
			);
			if (isRowEmpty) {
				continue;
			}
			// строка заголовка выгрузки («Код», «Категория», …, «Цена»)
			if (index === 0 && Number.isNaN(Number(rowValues[COLUMNS.price]))) {
				continue;
			}

			try {
				const product = this.readRow(rowValues);
				const missing = this.findMissingFields(product);
				if (missing.length) {
					errorRows.push([
						...rowValues,
						'',
						`В строке ${index + 1} отсутствуют обязательные поля: ${missing.join(', ')}`
					]);
					continue;
				}

				const pending = await this.importRow(product, colorMap, sizeMap);
				if (downloadImages) {
					await this.downloadImages(pending);
				}
			} catch (err) {
				errorRows.push([...rowValues, '', `Строка ${index + 1}: `, String(err)]);
			}
		}

		return xlsx.build([
			{
				name: errorRows.length ? 'Ошибки' : 'Ошибок нет',
				data: errorRows,
				options: {}
			}
		]);
	}

	private readRow(rowValues: unknown[]): ParseProductArticleDto {
		const cell = (idx: number): string =>
			rowValues[idx] === undefined || rowValues[idx] === null
				? ''
				: String(rowValues[idx]).trim();
		const optional = (idx: number): string | undefined => cell(idx) || undefined;

		return {
			article: cell(COLUMNS.article),
			color: {
				name: cell(COLUMNS.colorName)
					? capitalizeFirstLetter(cell(COLUMNS.colorName))
					: '',
				url: cell(COLUMNS.colorUrl)
			},
			size: cell(COLUMNS.size),
			amount: parseAmount(rowValues[COLUMNS.amount]),
			price: Number(rowValues[COLUMNS.price]),
			country: optional(COLUMNS.country),
			description: optional(COLUMNS.description),
			brand: optional(COLUMNS.brand),
			composition: optional(COLUMNS.composition),
			productCategory: cell(COLUMNS.productCategory),
			productSubcategory: cell(COLUMNS.productSubcategory),
			name: optional(COLUMNS.name),
			imageUrls: cell(COLUMNS.imageUrls)
				.split(';')
				.map((url) => url.trim())
				.filter(Boolean)
		};
	}

	private findMissingFields(product: ParseProductArticleDto): string[] {
		const missing: string[] = [];
		if (!product.article) missing.push('article');
		if (product.price === null || Number.isNaN(product.price)) missing.push('price');
		if (product.amount === null || Number.isNaN(product.amount))
			missing.push('amount');
		if (!product.color.name) missing.push('color.name');
		if (!product.size) missing.push('size');
		if (!product.productCategory) missing.push('productCategory');
		if (!product.productSubcategory) missing.push('productSubcategory');
		return missing;
	}

	private async importRow(
		productDto: ParseProductArticleDto,
		colorMap: Map<string, string>,
		sizeMap: Map<string, string>
	): Promise<PendingImages> {
		const mappedColor = colorMap.get(productDto.color.name);
		if (!mappedColor) {
			throw new Error(`Нет такого цвета в файле преобразования`);
		}
		const mappedSize = sizeMap.get(productDto.size.toUpperCase());
		if (!mappedSize) {
			throw new Error(`Нет такого размера в файле преобразования`);
		}

		return this.dataSource.transaction(async (manager) => {
			const productSubcategory = await this.findOrCreateSubcategory(
				manager,
				productDto
			);

			const article = await this.upsertArticle(
				manager,
				productDto,
				productSubcategory
			);

			const color = await manager.findOne(ProductColor, {
				where: { name: mappedColor }
			});
			if (!color) {
				throw new Error(`В БД не найден такой цвет`);
			}

			let size = await manager.findOne(ProductSize, {
				where: { name: mappedSize }
			});
			if (!size) {
				size = await manager.save(ProductSize, { name: mappedSize });
			}

			const existProduct = await manager.findOne(Product, {
				where: {
					productArticle: { id: article.id },
					productColor: { id: color.id },
					productSize: { id: size.id }
				},
				// вариант мог уйти в архив при прошлой замене каталога
				withDeleted: true
			});
			if (existProduct) {
				await manager.update(Product, existProduct.id, {
					amount: productDto.amount,
					deleted_at: null
				});
			} else {
				await manager.save(Product, {
					amount: productDto.amount,
					productColor: color,
					productSize: size,
					productArticle: article
				});
			}

			return {
				article,
				color,
				colorUrl: productDto.color.url || undefined,
				imageUrls: productDto.imageUrls
			};
		});
	}

	// Категории и подкатегории из выгрузки создаются автоматически
	private async findOrCreateSubcategory(
		manager: EntityManager,
		productDto: ParseProductArticleDto
	): Promise<ProductSubcategory> {
		const category =
			(await manager.findOne(ProductCategory, {
				where: { name: productDto.productCategory }
			})) ??
			(await manager.save(ProductCategory, { name: productDto.productCategory }));

		return (
			(await manager.findOne(ProductSubcategory, {
				where: {
					name: productDto.productSubcategory,
					productCategory: { id: category.id }
				}
			})) ??
			(await manager.save(ProductSubcategory, {
				name: productDto.productSubcategory,
				productCategory: category
			}))
		);
	}

	private async upsertArticle(
		manager: EntityManager,
		productDto: ParseProductArticleDto,
		productSubcategory: ProductSubcategory
	): Promise<ProductArticle> {
		const fields = {
			price: productDto.price,
			country: productDto.country,
			name: productDto.name,
			description: productDto.description,
			brand: productDto.brand,
			composition: productDto.composition,
			productSubcategory
		};

		const existing = await manager.findOne(ProductArticle, {
			where: { article: productDto.article },
			withDeleted: true
		});
		if (!existing) {
			return manager.save(ProductArticle, {
				article: productDto.article,
				...fields
			});
		}

		// артикул из архива возвращается в каталог (скрытым — публикует админ)
		await manager.update(ProductArticle, existing.id, {
			...fields,
			deleted_at: null
		});
		return existing;
	}

	// Ошибка скачивания картинки не должна ронять импорт строки
	private async downloadImages({ article, color, colorUrl, imageUrls }: PendingImages) {
		const manager = this.dataSource.manager;

		if (colorUrl && !color.url) {
			let image: string | undefined;
			try {
				image = await this.downloadToStorage(colorUrl, 'color', color.name);
			} catch (error) {
				this.logImageError(`цвета "${color.name}"`, colorUrl, error);
			}
			await manager.update(
				ProductColor,
				{ id: color.id },
				{ url: colorUrl, image }
			);
		}

		if (!imageUrls.length) {
			return;
		}

		const existingFiles = await manager.find(ProductFile, {
			where: { productArticle: { id: article.id } }
		});
		const knownUrls = new Set(existingFiles.map((file) => file.url));
		// Первая успешно загруженная картинка становится логотипом, если его ещё нет
		let needsLogo = existingFiles.length === 0;

		for (const url of imageUrls) {
			if (knownUrls.has(url)) {
				continue;
			}
			try {
				const name = await this.downloadToStorage(
					url,
					'product',
					article.article
				);
				await manager.save(ProductFile, {
					name,
					url,
					isLogo: needsLogo,
					productArticle: article
				});
				knownUrls.add(url);
				needsLogo = false;
			} catch (error) {
				this.logImageError(`продукта "${article.article}"`, url, error);
			}
		}
	}

	private logImageError(target: string, url: string, error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		this.logger.warn(
			`[Импорт] Не удалось скачать изображение ${target} (URL: ${url}): ${message}`
		);
	}

	/**
	 * Полная замена каталога: товары и артикулы, на которые есть заказы,
	 * помечаются удалёнными, остальные удаляются физически.
	 */
	private async clearCatalog() {
		await this.dataSource.transaction(async (manager) => {
			const products = await manager.find(Product, {
				relations: { orderProducts: true },
				withDeleted: true
			});
			const ordered = products
				.filter((p) => p.orderProducts?.length)
				.map((p) => p.id);
			const unordered = products
				.filter((p) => !p.orderProducts?.length)
				.map((p) => p.id);
			if (ordered.length) await manager.softDelete(Product, ordered);
			if (unordered.length) await manager.delete(Product, unordered);

			// у артикула остались варианты — значит, на них есть заказы: в архив
			const articles = await manager.find(ProductArticle, {
				relations: { products: true },
				withDeleted: true
			});
			const withOrders = articles
				.filter((a) => a.products?.length)
				.map((a) => a.id);
			const withoutProducts = articles
				.filter((a) => !a.products?.length)
				.map((a) => a.id);
			if (withOrders.length) {
				await manager.update(ProductArticle, withOrders, { isVisible: false });
				await manager.softDelete(ProductArticle, withOrders);
			}
			// фото удаляются каскадом (product_file.productArticleId ON DELETE CASCADE)
			if (withoutProducts.length)
				await manager.delete(ProductArticle, withoutProducts);
		});
	}

	// colors.xlsx: «название у поставщика» → «название в каталоге»
	private async getColorMap(): Promise<Map<string, string>> {
		return this.readMapping(await getColorsPath(), capitalizeFirstLetter);
	}

	// sizes.xlsx: «размер у поставщика» → «размер в каталоге»
	private async getSizeMap(): Promise<Map<string, string>> {
		return this.readMapping(await getSizesPath(), (value) => value.toUpperCase());
	}

	private readMapping(filePath: string, normalize: (value: string) => string) {
		const data = xlsx.parse(filePath)[0].data;
		const map = new Map<string, string>();
		for (const [from, to] of data) {
			const source = String(from ?? '').trim();
			const target = String(to ?? '').trim();
			if (source && target) {
				map.set(normalize(source), normalize(target));
			}
		}
		return map;
	}
}
