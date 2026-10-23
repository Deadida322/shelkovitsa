import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { GetListDto } from 'src/common/dto/GetListDto';
import { Auth } from 'src/decorators/auth';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { OrderDto } from './dto/OrderDto';
import { OrderService } from './order.service';

@ApiTags('Order')
@Controller('order')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Post()
	@Throttle({ default: { limit: 20, ttl: 60_000 } })
	@ApiOperation({ summary: 'Оформить заказ (гостем или вошедшим пользователем)' })
	@ApiResponse({ status: 201, type: OrderDto })
	@ApiResponse({
		status: 400,
		description: 'Нет товара, не хватает остатка, нет доставки'
	})
	async create(
		@Body() payload: CreateOrderDto,
		@Req() request: Request
	): Promise<OrderDto> {
		return this.orderService.create(payload, request.user?.id);
	}

	@Get()
	@Auth()
	@ApiCookieAuth('access_token')
	@ApiOperation({ summary: 'Мои заказы' })
	async getMine(
		@Query() query: GetListDto,
		@Req() request: Request
	): Promise<IPaginateResult<OrderDto>> {
		return this.orderService.getOrderList(query, request.user.id);
	}
}
