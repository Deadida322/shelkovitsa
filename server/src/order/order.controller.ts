import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiCookieAuth,
	ApiBody
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { GetListDto } from 'src/common/dto/GetListDto';
import { OrderDto } from './dto/OrderDto';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { AdminAuth } from 'src/decorators/adminAuth';
import { ChangeOrderStatusDto } from './dto/ChangeOrderStatusDto';

@ApiTags('Order')
@Controller('order')
export class OrderController {
	constructor(private orderService: OrderService) {}

	@Post()
	@Auth()
	@ApiOperation({ summary: 'Получить список заказов пользователя' })
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Список заказов', type: OrderDto, isArray: false })
	@ApiBody({ type: GetListDto })
	async getList(
		@Body() getListDto: GetListDto,
		@Req() request: Request
	): Promise<IPaginateResult<OrderDto>> {
		const userId = request.user.id;
		return this.orderService.getOrderList(getListDto, userId);
	}
	@Patch('admin/changeStatus')
	@AdminAuth()
	@ApiOperation({ summary: 'Изменить статус заказа (админ)' })
	@ApiBearerAuth('JWT-auth')
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Заказ обновлен', type: OrderDto })
	@ApiBody({ type: ChangeOrderStatusDto })
	async ChangeOrderStatus(@Body() payload: ChangeOrderStatusDto) {
		return this.orderService.changeOrderStatus(payload);
	}

	@Post('admin')
	@AdminAuth()
	@ApiOperation({ summary: 'Получить список всех заказов (админ)' })
	@ApiBearerAuth('JWT-auth')
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Список всех заказов', type: OrderDto, isArray: false })
	@ApiBody({ type: GetListDto })
	async getAdminList(
		@Body() getListDto: GetListDto
	): Promise<IPaginateResult<OrderDto>> {
		return this.orderService.getAdminOrderList(getListDto);
	}

	@Post('/create')
	@ApiOperation({ summary: 'Создать новый заказ' })
	@ApiResponse({ status: 201, description: 'Заказ создан', type: OrderDto })
	@ApiResponse({ status: 400, description: 'Ошибка валидации' })
	@ApiBody({ type: CreateOrderDto })
	async createOrder(@Body() payload: CreateOrderDto, @Req() request: Request) {
		let userId = request.user?.id ?? undefined;
		return this.orderService.create(payload, userId);
	}

	@Post('admin/retry-telegram/:orderId')
	@AdminAuth()
	@ApiOperation({ summary: 'Повторно отправить Telegram сообщение для заказа (админ)' })
	@ApiBearerAuth('JWT-auth')
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Результат повторной отправки' })
	async retryTelegramMessage(@Param('orderId', ParseIntPipe) orderId: number) {
		return this.orderService.retryTelegramMessage(orderId);
	}

	@Get('admin/failed-telegram')
	@AdminAuth()
	@ApiOperation({ summary: 'Получить заказы с неудачными Telegram сообщениями (админ)' })
	@ApiBearerAuth('JWT-auth')
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Список заказов с ошибками', type: OrderDto, isArray: true })
	async getOrdersWithFailedTelegram() {
		return this.orderService.getOrdersWithFailedTelegramMessages();
	}
}
