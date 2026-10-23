import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/app.setup';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { OrderNotificationService } from 'src/telegram/order-notification.service';

export async function createTestApp(): Promise<INestApplication> {
	const moduleRef = await Test.createTestingModule({
		imports: [AppModule]
	}).compile();

	// первый файл накатывает схему на свежую БД (до init — его хуки уже читают таблицы)
	await moduleRef.get(DataSource).runMigrations();

	const app = moduleRef.createNestApplication();
	configureApp(app);
	await app.init();
	return app;
}

export async function resetDb(app: INestApplication) {
	// фоновые отправки в Telegram от предыдущего теста не должны пересечься с TRUNCATE
	await app.get(OrderNotificationService).waitForPendingNotifications();
	const dataSource = app.get(DataSource);
	const tables = dataSource.entityMetadatas
		.map((meta) => `"${meta.tableName}"`)
		.join(', ');
	await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}

export const ADMIN = { mail: 'admin@test.ru', fio: 'Админ', password: 'admin-pass' };
export const CUSTOMER = {
	mail: 'user@test.ru',
	fio: 'Покупатель',
	password: 'user-pass'
};

// Регистрирует пользователя и возвращает agent с сохранённой кукой авторизации
export async function registerAgent(
	app: INestApplication,
	user: { mail: string; fio: string; password: string }
) {
	const agent = request.agent(app.getHttpServer());
	await agent
		.post('/api/auth/register')
		.send({ ...user, rePassword: user.password })
		.expect(201);
	return agent;
}

// Админ: обычная регистрация + роль admin (как делает npm run admin:create)
export async function registerAdmin(app: INestApplication) {
	const agent = await registerAgent(app, ADMIN);
	await app
		.get(DataSource)
		.query(`UPDATE "user" SET role = 'admin' WHERE mail = $1`, [ADMIN.mail]);
	return agent;
}

export interface SeededCatalog {
	deliveryType: DeliveryType;
	article: ProductArticle;
	product: Product;
	color: ProductColor;
	size: ProductSize;
}

export async function seedCatalog(
	app: INestApplication,
	options: { amount?: number; price?: number; withImage?: boolean } = {}
): Promise<SeededCatalog> {
	const manager = app.get(DataSource).manager;

	const deliveryType = await manager.save(DeliveryType, { name: 'Почта России' });
	const category = await manager.save(ProductCategory, { name: 'Бюстгальтеры' });
	const subcategory = await manager.save(ProductSubcategory, {
		name: 'Классические',
		productCategory: category
	});
	const color = await manager.save(ProductColor, { name: 'Чёрный' });
	const size = await manager.save(ProductSize, { name: '75B' });
	const article = await manager.save(ProductArticle, {
		article: 'ART-001',
		name: 'Бюстгальтер тестовый',
		price: options.price ?? 1500,
		isVisible: true,
		productSubcategory: subcategory
	});
	const product = await manager.save(Product, {
		amount: options.amount ?? 5,
		productArticle: article,
		productColor: color,
		productSize: size
	});
	// опубликованный артикул по правилам должен иметь фото
	if (options.withImage ?? true) {
		await manager.save(ProductFile, {
			name: 'seed.png',
			isLogo: true,
			productArticle: article
		});
	}

	return { deliveryType, article, product, color, size };
}

export function orderPayload(
	catalog: SeededCatalog,
	orderProducts: { productId: number; amount: number }[]
) {
	return {
		fio: 'Иван Иванов',
		mail: 'ivan@example.com',
		tel: '+79991234567',
		region: 'Москва',
		address: 'ул. Примерная, д. 1',
		deliveryTypeId: catalog.deliveryType.id,
		orderProducts
	};
}
