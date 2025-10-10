import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { encodePsd } from 'src/helpers/authHelper';
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
		const psd = encodePsd(password);

		return this.usersRepository.findOne({
			where: {
				mail,
				password: psd
			}
		});
	}

	async findOneByMailAndId(mail: string, id: number): Promise<User | undefined> {
		return this.usersRepository.findOne({
			where: {
				mail,
				id
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
