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

const AppDataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST,
	port: +process.env.DB_PORT,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	// entities: [`${__dirname}/entities/**{.ts,.js}`],
	entities: [Product],
	migrations: [`${__dirname}/migrations/**{.ts,.js}`],
	logging: false,
	synchronize: false
});

export default AppDataSource;
