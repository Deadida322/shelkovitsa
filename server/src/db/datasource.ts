// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Product } from './entities/Product';

// export default TypeOrmModule.forRoot({
// 	type: 'postgres',
// 	host: process.env.DB_HOST,
// 	port: +process.env.DB_PORT,
// 	username: process.env.DB_USER,
// 	password: process.env.DB_PASSWORD,
// 	database: process.env.DB_NAME,
// 	entities: [Product],
// 	// migrations: ['dist/db/migrations/*{.ts,.js}'],
// 	autoLoadEntities: true,
// 	logging: false,
// 	synchronize: false
// });

import { DataSource } from 'typeorm';
import 'dotenv/config';
import { Product } from './entities/Product';
import { User } from './entities/User';
import { ProductFile } from './entities/ProductFile';
import { Benefit } from './entities/Benefit';
import { ProductSize } from './entities/ProductSize';
import { Size } from './entities/Size';
import { DeliveryType } from './entities/DeliveryType';
import { Order } from './entities/Order';
import { OrderProduct } from './entities/OrderProduct';
import { ProductCategory } from './entities/ProductCategory';
import { ProductColor } from './entities/ProductColor';
import { ProductSubcategory } from './entities/ProductSubcategory';

const AppDataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST,
	port: +process.env.DB_PORT,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	entities: [`${__dirname}/entities/**{.ts,.js}`],
	// entities: [
	// 	Product,
	// 	User,
	// 	ProductFile,
	// 	Benefit,
	// 	Size,
	// 	ProductSize,
	// 	DeliveryType,
	// 	Order,
	// 	OrderProduct,
	// 	ProductCategory,
	// 	ProductColor,
	// 	ProductCategory,
	// 	ProductSubcategory
	// ],
	migrations: [`${__dirname}/migrations/**{.ts,.js}`],
	logging: false,
	synchronize: false
});

export default AppDataSource;
