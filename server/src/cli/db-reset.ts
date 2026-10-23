import 'reflect-metadata';
import AppDataSource from 'src/db/datasource';

// Только для разработки: удаляет все таблицы и накатывает миграции с нуля.
// Использование: npm run db:reset
async function main() {
	if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
		console.error(
			'NODE_ENV=production: сброс БД запрещён (флаг --force, если вы уверены)'
		);
		process.exit(1);
	}

	await AppDataSource.initialize();
	try {
		console.log(`Сброс БД ${AppDataSource.options.database}...`);
		await AppDataSource.dropDatabase();
		const migrations = await AppDataSource.runMigrations();
		console.log(`Готово, применено миграций: ${migrations.length}`);
	} finally {
		await AppDataSource.destroy();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
