import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/db/entities/User';
import { UserInRequest } from 'src/types/express/custom';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService
	) {}

	async signIn(mail: string, password: string): Promise<{ access_token: string }> {
		const user = await this.userService.findOneByMailAndPass(mail, password);
		if (!user) {
			throw new UnauthorizedException();
		}
		const payload: UserInRequest = { id: user.id, mail: user.mail };
		return {
			access_token: await this.jwtService.signAsync(payload)
		};
	}
	async generateAccess(user: User): Promise<{ access_token: string }> {
		const payload: UserInRequest = { id: user.id, mail: user.mail };
		return {
			access_token: await this.jwtService.signAsync(payload)
		};
	}
}
