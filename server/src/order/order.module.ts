import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/db/entities/Order';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';

@Module({
	imports: [TypeOrmModule.forFeature([Order, OrderProduct, Product])],
	controllers: [OrderController],
	providers: [OrderService]
})
export class OrderModule {}
