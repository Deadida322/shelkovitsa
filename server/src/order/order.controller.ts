import { Body, Controller, ExecutionContext, Get, Post, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { GetListDto } from 'src/common/dto/GetListDto';
import { OrderDto } from './dto/OrderDto';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { AdminAuth } from 'src/decorators/adminAuth';

@Controller('order')
export class OrderController {
	constructor(private orderService: OrderService) {}

	@Post()
	@Auth()
	async getList(
		@Body() getListDto: GetListDto,
		@Req() request: Request
	): Promise<IPaginateResult<OrderDto>> {
		const userId = request.user.id;
		return this.orderService.getOrderList(getListDto, userId);
	}

	@Post('admin')
	@AdminAuth()
	async getAdminList(
		@Body() getListDto: GetListDto
	): Promise<IPaginateResult<OrderDto>> {
		return this.orderService.getAdminOrderList(getListDto);
	}

	@Post('/create')
	async createOrder(@Body() payload: CreateOrderDto, @Req() request: Request) {
		let userId = request.user?.id ?? undefined;
		return this.orderService.create(payload, userId);
	}
}
