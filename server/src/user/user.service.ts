import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { encodePsd } from 'src/helpers/authHelper';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>
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
}
