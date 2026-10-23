import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Telegram } from 'telegraf';
import { Order } from 'src/db/entities/Order';
import { TelegramOrderMessage } from 'src/db/entities/TelegramOrderMessage';
import { OrderNotificationService } from './order-notification.service';
import { TELEGRAM } from './telegram.constants';

@Module({
	imports: [TypeOrmModule.forFeature([Order, TelegramOrderMessage])],
	providers: [
		{
			provide: TELEGRAM,
			inject: [ConfigService],
			// Бот только отправляет сообщения: polling/webhook не нужен, сеть при старте не трогаем
			useFactory: (config: ConfigService) => {
				const token = config.get<string>('TELEGRAM_TOKEN');
				const enabled = config.get<string>('TELEGRAM_ENABLED') !== 'false';
				return enabled && token ? new Telegram(token) : null;
			}
		},
		OrderNotificationService
	],
	exports: [OrderNotificationService]
})
export class TelegramModule {}
