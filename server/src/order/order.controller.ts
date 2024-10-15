import { Body, Controller, ExecutionContext, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/CreateOrderDto';

@Controller('order')
export class OrderController {
	constructor(private orderService: OrderService) {}

	@Post('/create')
	async createOrder(@Body() payload: CreateOrderDto, context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const user = request.user;
		console.log({ user });

		return this.orderService.create(payload);
	}
}
