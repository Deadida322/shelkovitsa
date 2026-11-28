import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
	SerializeOptions
} from '@nestjs/common';
import { PaginatedDto } from 'src/common/dto/PaginatedDto';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from 'src/decorators/adminAuth';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import { Request } from 'express';
import { ChangeOrderStatusDto } from './dto/ChangeOrderStatusDto';
import { GetAdminOrderListDto } from './dto/GetAdminOrderListDto';
import { OrderAdminDto } from './dto/OrderAdminDto';
import { OrderDto } from './dto/OrderDto';
import { OrderService } from './order.service';

@ApiTags('Admin: Order')
@ApiCookieAuth('access_token')
@AdminAuth()
@Controller('admin/order')
export class OrderAdminController {
	constructor(
		private readonly orderService: OrderService,
		private readonly notifications: OrderNotificationService
	) {}

	@SerializeOptions({ type: PaginatedDto(OrderAdminDto) })
	@Get()
	@ApiOperation({ summary: 'Все заказы, новые сначала' })
	async getList(@Query() query: GetAdminOrderListDto) {
		return this.orderService.getAdminOrderList(query);
	}

	@SerializeOptions({ type: OrderAdminDto })
	@Get('telegram-failed')
	@ApiOperation({ summary: 'Заказы с неотправленным Telegram-уведомлением' })
	async getFailedTelegram() {
		return this.notifications.getOrdersWithFailedTelegramMessages();
	}

	@SerializeOptions({ type: OrderDto })
	@Patch(':id')
	@ApiOperation({ summary: 'Сменить статус заказа' })
	async changeStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: ChangeOrderStatusDto,
		@Req() req: Request
	) {
		return this.orderService.changeOrderStatus(id, payload, {
			id: req.user?.id,
			mail: req.user?.mail
		});
	}

	@Post(':id/telegram-retry')
	@ApiOperation({ summary: 'Повторно отправить Telegram-уведомление' })
	async retryTelegram(@Param('id', ParseIntPipe) id: number) {
		return this.notifications.retryTelegramMessage(id);
	}
}
