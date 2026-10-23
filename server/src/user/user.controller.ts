import {
	BadRequestException,
	Body,
	Controller,
	Get,
	ParseArrayPipe,
	Put,
	Req
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth';
import { BasketItemDto } from './dto/BasketItemDto';
import { UserService } from './user.service';

const MAX_BASKET_ITEMS = 100;

@ApiTags('User')
@ApiCookieAuth('access_token')
@Auth()
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get('basket')
	@ApiOperation({ summary: 'Корзина пользователя' })
	async getBasket(@Req() request: Request) {
		return (await this.userService.getBasket(request.user.id)) ?? [];
	}

	@Put('basket')
	@ApiOperation({ summary: 'Сохранить корзину пользователя целиком' })
	@ApiBody({ type: [BasketItemDto] })
	async updateBasket(
		@Body(new ParseArrayPipe({ items: BasketItemDto, whitelist: true }))
		items: BasketItemDto[],
		@Req() request: Request
	) {
		if (items.length > MAX_BASKET_ITEMS) {
			throw new BadRequestException(
				`В корзине не больше ${MAX_BASKET_ITEMS} позиций`
			);
		}
		return this.userService.updateBasket(items, request.user.id);
	}
}
