import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/db/entities/Order';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/CreateOrderDto';

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order)
		private orderRepository: Repository<Order>
	) {}

	async create(createOrderDto: CreateOrderDto) {
		// await this.orderRepository.save()
	}
}
