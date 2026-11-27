import {
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	SerializeOptions
} from '@nestjs/common';
import { PaginatedDto } from 'src/common/dto/PaginatedDto';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { GetCustomerOrderListDto } from './dto/GetCustomerOrderListDto';
import { OrderDto } from './dto/OrderDto';
import { OrderService } from './order.service';

@ApiTags('Order')
@Controller('order')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@SerializeOptions({ type: OrderDto })
	@Post()
	@Throttle({ default: { limit: 20, ttl: 60_000 } })
	@ApiOperation({ summary: 'Оформить заказ (гостем или вошедшим пользователем)' })
	@ApiResponse({ status: 201, type: OrderDto })
	@ApiResponse({
		status: 400,
		description: 'Нет товара, не хватает остатка, нет доставки'
	})
	async create(@Body() payload: CreateOrderDto, @Req() request: Request) {
		return this.orderService.create(payload, request.user?.id);
	}

	@SerializeOptions({ type: PaginatedDto(OrderDto) })
	@Get()
	@Auth()
	@ApiCookieAuth('access_token')
	@ApiOperation({
		summary: 'Мои заказы',
		description:
			'scope=active (по умолчанию) — create|in_work|payment|delivery; scope=completed — close|cancelled'
	})
	async getMine(@Query() query: GetCustomerOrderListDto, @Req() request: Request) {
		return this.orderService.getOrderList(query, request.user.id);
	}
}
