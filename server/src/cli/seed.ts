import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { User, UserRole } from 'src/db/entities/User';
import { hashPassword } from 'src/helpers/authHelper';
import { buildXlsx, readSheet } from 'src/helpers/excelHelper';
import { getSrcPath, initDiskStorage } from 'src/helpers/storageHelper';
import { ProductImportService } from 'src/product-article/product-import.service';

/**
 * Наполнение БД для разработки. Повторный запуск безопасен (всё через upsert).
 *
 *   npm run seed                      админ, доставка, 30 артикулов с картинками
 *   npm run seed -- --articles 200    больше товаров
 *   npm run seed -- --no-images       без скачивания картинок (быстро, без сети)
 *   npm run seed -- --file <xlsx>     другая выгрузка поставщика
 *
 * Админ: SEED_ADMIN_MAIL / SEED_ADMIN_PASSWORD (по умолчанию admin@shelkovitsa.local / admin12345)
 */

const DEFAULT_FILE = path.resolve(process.cwd(), '..', 'temp-dev', 'shel_data_new.xlsx');
const ARTICLE_COLUMN = 13;

const DELIVERY_TYPES = [
	{ name: 'Почта России', description: 'Доставка в отделение Почты России' },
	{ name: 'СДЭК', description: 'Доставка до пункта выдачи СДЭК' },
	{ name: 'Курьер', description: 'Курьерская доставка по Москве' }
];

function argValue(name: string): string | undefined {
	const index = process.argv.indexOf(name);
	return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
	if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
		console.error(
			'NODE_ENV=production: сид только для разработки (флаг --force, если вы уверены)'
		);
		process.exit(1);
	}

	const articlesLimit = Number(argValue('--articles') ?? 30);
	const downloadImages = !process.argv.includes('--no-images');
	const sourceFile = path.resolve(argValue('--file') ?? DEFAULT_FILE);

	initDiskStorage();
	const app = await NestFactory.createApplicationContext(AppModule, {
		logger: ['error', 'warn']
	});
	try {
		const dataSource = app.get(DataSource);

		await seedAdmin(dataSource);
		await seedDeliveryTypes(dataSource);
		await seedCatalog(
			app.get(ProductImportService),
			sourceFile,
			articlesLimit,
			downloadImages
		);
		await publishReadyArticles(dataSource, downloadImages);
	} finally {
		await app.close();
	}
}

async function seedAdmin(dataSource: DataSource) {
	const mail = process.env.SEED_ADMIN_MAIL ?? 'admin@shelkovitsa.local';
	const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';
	const repository = dataSource.getRepository(User);

	const existing = await repository.findOne({ where: { mail }, withDeleted: true });
	await repository.save({
		...(existing ?? {}),
		mail,
		fio: existing?.fio ?? 'Администратор',
		password: await hashPassword(password),
		role: UserRole.ADMIN,
		deleted_at: null
	});
	console.log(`Админ: ${mail} / ${password}`);
}

async function seedDeliveryTypes(dataSource: DataSource) {
	const repository = dataSource.getRepository(DeliveryType);
	for (const type of DELIVERY_TYPES) {
		const existing = await repository.findOne({ where: { name: type.name } });
		await repository.save({ ...(existing ?? {}), ...type });
	}
	console.log(`Способы доставки: ${DELIVERY_TYPES.map((t) => t.name).join(', ')}`);
}

// Берём строки первых N артикулов (у артикула несколько строк — по цвету и размеру)
async function seedCatalog(
	importService: ProductImportService,
	sourceFile: string,
	articlesLimit: number,
	downloadImages: boolean
) {
	const [header, ...rows] = await readSheet(sourceFile);

	const articles = new Set<string>();
	const selected = rows.filter((row) => {
		const article = String(row?.[ARTICLE_COLUMN] ?? '').trim();
		if (!article) return false;
		if (!articles.has(article) && articles.size >= articlesLimit) return false;
		articles.add(article);
		return true;
	});

	const subsetFile = getSrcPath(`seed-${Date.now()}.xlsx`);
	await fs.writeFile(subsetFile, await buildXlsx('seed', [header, ...selected]));
	console.log(
		`Импорт ${articles.size} артикулов (${selected.length} строк) из ${path.basename(sourceFile)}` +
			(downloadImages
				? ' с картинками — это может занять пару минут'
				: ' без картинок')
	);

	try {
		const errorsFile = await importService.importFromExcel(
			subsetFile,
			{ isDeletedOther: false },
			{ downloadImages }
		);
		const errors = (await readSheet(errorsFile)).length;
		console.log(errors ? `Строк с ошибками: ${errors}` : 'Импорт без ошибок');
	} finally {
		await fs.unlink(subsetFile).catch(() => undefined);
	}
}

// Те же условия, что при публикации из админки; без картинок — допускаем пустые фото
async function publishReadyArticles(dataSource: DataSource, requireImages: boolean) {
	const query = dataSource
		.createQueryBuilder()
		.update(ProductArticle)
		.set({ isVisible: true })
		.where('name IS NOT NULL')
		.andWhere(
			'EXISTS (SELECT 1 FROM product p WHERE p."productArticleId" = product_article.id AND p.deleted_at IS NULL)'
		);
	if (requireImages) {
		query.andWhere(
			'EXISTS (SELECT 1 FROM product_file f WHERE f."productArticleId" = product_article.id)'
		);
	}
	const { affected } = await query.execute();
	console.log(`Опубликовано артикулов: ${affected}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
