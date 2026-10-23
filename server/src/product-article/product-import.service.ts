import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as xlsx from 'node-xlsx';
import { DataSource, EntityManager } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { downloadImageToStatic } from 'src/helpers/imageDownloadHelper';
import { getColorsPath, getSizesPath } from 'src/helpers/storageHelper';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import { ParseProductArticleDto } from './dto/ParseProductArticleDto';
import { UploadProductArticleFileDto } from './dto/UploadProductArticleFileDto';

// Номера колонок в выгрузке поставщика
const COLUMNS = {
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

	constructor(private readonly dataSource: DataSource) {}

	async importFromExcel(
		filePath: string,
		options: UploadProductArticleFileDto
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
				await this.downloadImages(pending);
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
			amount: Number(rowValues[COLUMNS.amount]),
			price: Number(rowValues[COLUMNS.price]),
			country: optional(COLUMNS.country),
			description: optional(COLUMNS.description),
			brand: optional(COLUMNS.brand),
			composition: optional(COLUMNS.composition),
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
			const productSubcategory = await manager.findOne(ProductSubcategory, {
				where: { name: productDto.productSubcategory, is_deleted: false }
			});
			if (!productSubcategory) {
				throw new Error(`Не найдена подкатегория`);
			}

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
			await manager.update(ProductColor, { id: color.id }, { is_deleted: false });

			let size = await manager.findOne(ProductSize, {
				where: { name: mappedSize }
			});
			if (!size) {
				size = await manager.save(ProductSize, { name: mappedSize });
			} else {
				await manager.update(ProductSize, { id: size.id }, { is_deleted: false });
			}

			const existProduct = await manager.findOne(Product, {
				where: {
					productArticle: { id: article.id },
					productColor: { id: color.id },
					productSize: { id: size.id }
				}
			});
			if (existProduct) {
				await manager.update(
					Product,
					{ id: existProduct.id },
					{ is_deleted: false, amount: productDto.amount }
				);
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
			where: { article: productDto.article }
		});
		if (!existing) {
			return manager.save(ProductArticle, {
				article: productDto.article,
				...fields
			});
		}

		await manager.update(
			ProductArticle,
			{ id: existing.id },
			{ ...fields, is_deleted: false }
		);
		return existing;
	}

	// Ошибка скачивания картинки не должна ронять импорт строки
	private async downloadImages({ article, color, colorUrl, imageUrls }: PendingImages) {
		const manager = this.dataSource.manager;

		if (colorUrl && !color.url) {
			let image: string | undefined;
			try {
				image = await downloadImageToStatic(colorUrl, 'color', color.name);
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
			where: { productArticle: { id: article.id }, is_deleted: false }
		});
		const knownUrls = new Set(existingFiles.map((file) => file.url));
		// Первая успешно загруженная картинка становится логотипом, если его ещё нет
		let needsLogo = existingFiles.length === 0;

		for (const url of imageUrls) {
			if (knownUrls.has(url)) {
				continue;
			}
			try {
				const name = await downloadImageToStatic(url, 'product', article.article);
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
				relations: { orderProducts: true }
			});
			const ordered = products
				.filter((p) => p.orderProducts?.length)
				.map((p) => p.id);
			const unordered = products
				.filter((p) => !p.orderProducts?.length)
				.map((p) => p.id);

			if (ordered.length) {
				await manager.update(Product, ordered, { is_deleted: true });
			}
			if (unordered.length) {
				await manager.delete(Product, unordered);
			}

			const articles = await manager.find(ProductArticle, {
				relations: { products: true }
			});
			const withOrders = articles
				.filter((a) => a.products?.length)
				.map((a) => a.id);
			const withoutProducts = articles
				.filter((a) => !a.products?.length)
				.map((a) => a.id);

			if (withOrders.length) {
				await manager.update(ProductArticle, withOrders, {
					is_deleted: true,
					isVisible: false
				});
			}
			if (withoutProducts.length) {
				await manager
					.createQueryBuilder()
					.delete()
					.from(ProductFile)
					.where('"productArticleId" IN (:...ids)', { ids: withoutProducts })
					.execute();
				await manager.delete(ProductArticle, withoutProducts);
			}
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
