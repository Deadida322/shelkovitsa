import 'reflect-metadata';
import AppDataSource from 'src/db/datasource';
import { User, UserRole } from 'src/db/entities/User';
import { hashPassword } from 'src/helpers/authHelper';

// Создаёт администратора или выдаёт права существующему пользователю.
// Использование: npm run admin:create -- <почта> <пароль> [ФИО]
async function main() {
	const [mail, password, fio = 'Администратор'] = process.argv.slice(2);
	if (!mail || !password) {
		console.error('Использование: npm run admin:create -- <почта> <пароль> [ФИО]');
		process.exit(1);
	}
	if (password.length < 8) {
		console.error('Пароль администратора должен быть не короче 8 символов');
		process.exit(1);
	}

	await AppDataSource.initialize();
	try {
		const repository = AppDataSource.getRepository(User);
		const existing = await repository.findOne({ where: { mail } });
		const passwordHash = await hashPassword(password);

		if (existing) {
			await repository.update(existing.id, {
				role: UserRole.ADMIN,
				password: passwordHash,
				is_deleted: false
			});
			console.log(
				`Пользователь ${mail} (id=${existing.id}) теперь администратор, пароль обновлён`
			);
		} else {
			const user = await repository.save({
				mail,
				fio,
				password: passwordHash,
				role: UserRole.ADMIN
			});
			console.log(`Создан администратор ${mail} (id=${user.id})`);
		}
	} finally {
		await AppDataSource.destroy();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
