import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { hashPassword, verifyPassword } from 'src/helpers/authHelper';
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
		if (!user) {
			return undefined;
		}

		const { valid, needsRehash } = await verifyPassword(password, user.password);
		if (!valid) {
			return undefined;
		}
		if (needsRehash) {
			user.password = await hashPassword(password);
			await this.usersRepository.update(user.id, { password: user.password });
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

	async updateBasket(basket: string, userId: number) {
		const result = await this.usersRepository.save({
			id: userId,
			basket
		});
		return JSON.parse(result.basket);
	}

	async getBasket(userId: number) {
		const result = await this.usersRepository.findOne({
			where: {
				id: userId
			}
		});
		return JSON.parse(result.basket);
	}
}
