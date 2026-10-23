import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UserDto } from 'src/auth/dto/UserDto';
import { User, UserRole } from 'src/db/entities/User';
import { ProductArticleAdminDto } from 'src/product-article/dto/ProductArticleAdminDto';
import { PaginatedDto } from './dto/PaginatedDto';

// Так же, как ClassSerializerInterceptor с { type } из @SerializeOptions
function serialize<T>(type: new () => T, value: object) {
	return instanceToPlain(plainToInstance(type, value), {
		excludeExtraneousValues: true,
		exposeUnsetFields: false
	});
}

describe('сериализация ответов', () => {
	const user = Object.assign(new User(), {
		id: 1,
		mail: 'a@b.ru',
		fio: 'Анна',
		password: '$2b$10$hash',
		role: UserRole.ADMIN,
		basket: [{ productId: 1 }]
	});

	it('UserDto: только mail, fio, isAdmin по роли', () => {
		expect(serialize(UserDto, user)).toEqual({
			mail: 'a@b.ru',
			fio: 'Анна',
			isAdmin: true
		});
	});

	it('сущность без DTO не утекает', () => {
		expect(
			instanceToPlain(user, {
				excludeExtraneousValues: true,
				exposeUnsetFields: false
			})
		).toEqual({});
	});

	it('PaginatedDto сериализует элементы своим DTO', () => {
		const Paginated = PaginatedDto(UserDto);
		expect(
			serialize(Paginated, { data: [user], count: 1, page: 0, itemsPerPage: 10 })
		).toEqual({
			data: [{ mail: 'a@b.ru', fio: 'Анна', isAdmin: true }],
			count: 1,
			page: 0,
			itemsPerPage: 10
		});
		expect(Paginated.name).toBe('PaginatedUserDto');
	});

	it('is_deleted в админке вычисляется из deleted_at', () => {
		const archived = serialize(ProductArticleAdminDto, {
			id: 1,
			article: 'A',
			deleted_at: new Date()
		});
		const active = serialize(ProductArticleAdminDto, {
			id: 2,
			article: 'B',
			deleted_at: null
		});
		expect(archived.is_deleted).toBe(true);
		expect(active.is_deleted).toBe(false);
		expect(archived).not.toHaveProperty('deleted_at');
	});
});
