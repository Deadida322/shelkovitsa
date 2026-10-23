import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/db/entities/Order';
import { TelegramOrderMessage } from 'src/db/entities/TelegramOrderMessage';
import { OrderNotificationService } from './order-notification.service';

@Module({
	imports: [TypeOrmModule.forFeature([Order, TelegramOrderMessage])],
	providers: [OrderNotificationService],
	exports: [OrderNotificationService]
})
export class TelegramModule {}
