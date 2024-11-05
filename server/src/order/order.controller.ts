import { Body, Controller, ExecutionContext, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/CreateOrderDto';

@Controller('order')
export class OrderController {
	constructor(private orderService: OrderService) {}

	@Post('/create')
	async createOrder(@Body() payload: CreateOrderDto, context: ExecutionContext) {
		return this.orderService.create(payload);
	}
}
