import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiCookieAuth,
	ApiBody
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { Auth } from 'src/decorators/auth';
import { Request } from 'express';

@ApiTags('User')
@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}
	@Post('basket')
	@Auth()
	@ApiOperation({ summary: 'Обновить корзину пользователя' })
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Корзина обновлена' })
	@ApiBody({ schema: { type: 'object' } })
	async updateBasket(@Body() payload: any, @Req() request: Request) {
		const basket = await this.userService.updateBasket(
			JSON.stringify(payload),
			request.user.id
		);

		return basket;
	}

	@Get('basket')
	@Auth()
	@ApiOperation({ summary: 'Получить корзину пользователя' })
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Корзина пользователя' })
	async getBasket(@Body() payload: any, @Req() request: Request) {
		const basket = await this.userService.getBasket(request.user.id);

		return basket;
	}
}
