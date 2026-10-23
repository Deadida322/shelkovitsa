import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { verifyPassword } from 'src/helpers/authHelper';
import { baseWhere } from 'src/common/utils';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>
	) {}

	async findOneByMailAndPass(
		mail: string,
		password: string
	): Promise<User | undefined> {
		const user = await this.usersRepository.findOne({ where: { mail } });
		if (!user || !(await verifyPassword(password, user.password))) {
			return undefined;
		}
		return user;
	}

	async findActiveByMailAndId(mail: string, id: number): Promise<User | undefined> {
		return this.usersRepository.findOne({
			where: {
				mail,
				id,
				...baseWhere
			}
		});
	}

	async updateBasket(basket: unknown, userId: number) {
		await this.usersRepository.update(userId, { basket });
		return basket;
	}

	async getBasket(userId: number) {
		const user = await this.usersRepository.findOne({ where: { id: userId } });
		return user?.basket ?? null;
	}
}
