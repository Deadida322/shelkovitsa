import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from 'src/decorators/auth';
import { Request } from 'express';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}
	@Post('basket')
	@Auth()
	async updateBasket(@Body() payload: any, @Req() request: Request) {
		const basket = await this.userService.updateBasket(
			JSON.stringify(payload),
			request.user.id
		);

		return basket;
	}

	@Get('basket')
	@Auth()
	async getBasket(@Body() payload: any, @Req() request: Request) {
		const basket = await this.userService.getBasket(request.user.id);

		return basket;
	}
}
