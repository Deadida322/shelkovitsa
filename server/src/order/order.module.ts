import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderAdminController } from './order-admin.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/db/entities/Order';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
	imports: [TypeOrmModule.forFeature([Order]), TelegramModule],
	controllers: [OrderController, OrderAdminController],
	providers: [OrderService]
})
export class OrderModule {}
