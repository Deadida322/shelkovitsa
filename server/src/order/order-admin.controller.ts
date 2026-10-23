import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetListDto } from 'src/common/dto/GetListDto';
import { AdminAuth } from 'src/decorators/adminAuth';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import { ChangeOrderStatusDto } from './dto/ChangeOrderStatusDto';
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

	@Get()
	@ApiOperation({ summary: 'Все заказы, новые сначала' })
	async getList(@Query() query: GetListDto): Promise<IPaginateResult<OrderAdminDto>> {
		return this.orderService.getAdminOrderList(query);
	}

	@Get('telegram-failed')
	@ApiOperation({ summary: 'Заказы с неотправленным Telegram-уведомлением' })
	async getFailedTelegram() {
		return this.notifications.getOrdersWithFailedTelegramMessages();
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Сменить статус заказа' })
	async changeStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: ChangeOrderStatusDto
	): Promise<OrderDto> {
		return this.orderService.changeOrderStatus(id, payload);
	}

	@Post(':id/telegram-retry')
	@ApiOperation({ summary: 'Повторно отправить Telegram-уведомление' })
	async retryTelegram(@Param('id', ParseIntPipe) id: number) {
		return this.notifications.retryTelegramMessage(id);
	}
}
