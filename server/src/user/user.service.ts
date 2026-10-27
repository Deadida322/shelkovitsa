import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { verifyPassword } from 'src/helpers/authHelper';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>
	) {}

	async findOneByMailAndPass(mail: string, password: string): Promise<User | null> {
		const user = await this.usersRepository.findOne({ where: { mail } });
		if (!user || !(await verifyPassword(password, user.password))) {
			return null;
		}
		return user;
	}

	async findActiveByMailAndId(mail: string, id: number): Promise<User | null> {
		return this.usersRepository.findOne({
			where: {
				mail,
				id
			}
		});
	}

	async updateBasket(basket: object[], userId: number) {
		await this.usersRepository.update(userId, { basket });
		return basket;
	}

	async getBasket(userId: number) {
		const user = await this.usersRepository.findOne({ where: { id: userId } });
		return user?.basket ?? null;
	}
}
