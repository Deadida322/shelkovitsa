import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order } from 'src/db/entities/Order';
import {
	TelegramMessageStatus,
	TelegramOrderMessage
} from 'src/db/entities/TelegramOrderMessage';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';
import { User } from 'src/db/entities/User';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { baseProductWhere } from 'src/product-article/product-article.types';
import { GetListDto } from 'src/common/dto/GetListDto';
import { convertToJson } from 'src/helpers/convertHelper';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { OrderDto } from './dto/OrderDto';
import { OrderAdminDto } from './dto/OrderAdminDto';
import { ChangeOrderStatusDto } from './dto/ChangeOrderStatusDto';
import { orderRelations } from './order.relations';

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		private readonly dataSource: DataSource,
		private readonly notifications: OrderNotificationService
	) {}

	async create(createOrderDto: CreateOrderDto, userId?: number) {
		const requested = createOrderDto.orderProducts;
		const productIds = requested.map((op) => op.productId);
		if (new Set(productIds).size !== productIds.length) {
			throw new BadRequestException(
				'Один и тот же товар указан в заказе несколько раз'
			);
		}

		const orderId = await this.dataSource.transaction(async (manager) => {
			const deliveryType = await manager.findOne(DeliveryType, {
				where: { id: createOrderDto.deliveryTypeId }
			});
			if (!deliveryType) {
				throw new BadRequestException('Не найден тип доставки');
			}

			// Блокируем строки товаров до конца транзакции, чтобы параллельные заказы
			// не продали один и тот же остаток дважды
			await manager
				.createQueryBuilder(Product, 'product')
				.setLock('pessimistic_write')
				.where('product.id IN (:...productIds)', { productIds })
				.getMany();

			const products = await manager.find(Product, {
				where: {
					id: In(productIds),
					productArticle: baseProductWhere
				},
				relations: { productArticle: true }
			});

			const orderProducts = requested.map(({ productId, amount }) => {
				const product = products.find((p) => p.id === productId);
				if (!product) {
					throw new BadRequestException(`Не найден продукт ${productId}`);
				}
				if (amount > product.amount) {
					throw new BadRequestException(
						`Недостаточное кол-во для ${product.productArticle?.name ?? ''}, Вы можете заказать только ${product.amount} единиц`
					);
				}
				return {
					amount,
					price: Number(product.productArticle.price),
					product
				};
			});

			const price = orderProducts.reduce(
				(acc, op) => acc + op.price * op.amount,
				0
			);

			const user = userId
				? await manager.findOne(User, { where: { id: userId } })
				: null;

			const order = await manager.save(Order, {
				fio: createOrderDto.fio,
				mail: createOrderDto.mail,
				tel: createOrderDto.tel,
				description: createOrderDto.description,
				region: createOrderDto.region,
				address: createOrderDto.address,
				price,
				deliveryType,
				user: user ?? undefined
			});

			await manager.save(
				OrderProduct,
				orderProducts.map((op) => ({ ...op, order }))
			);

			for (const op of orderProducts) {
				await manager.decrement(
					Product,
					{ id: op.product.id },
					'amount',
					op.amount
				);
			}

			// Запись о Telegram-сообщении создаём в той же транзакции,
			// чтобы админ всегда видел статус отправки
			await manager.save(TelegramOrderMessage, {
				order,
				status: TelegramMessageStatus.PENDING,
				retryCount: 0
			});

			return order.id;
		});

		const newOrder = await this.orderRepository.findOne({
			where: { id: orderId },
			relations: orderRelations,
			withDeleted: true
		});

		this.notifications.notifyOrderCreated(newOrder);

		return convertToJson(OrderDto, newOrder);
	}

	async getOrderList(
		getListDto: GetListDto,
		userId: number
	): Promise<IPaginateResult<OrderDto>> {
		const [result, total] = await this.orderRepository.findAndCount({
			where: {
				user: {
					id: userId
				}
			},
			relations: orderRelations,
			// позиции с товарами из архива остаются в заказе
			withDeleted: true,
			order: { created_at: 'DESC' },
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(OrderDto, result, total, getListDto);
	}

	async getAdminOrderList(
		getListDto: GetListDto
	): Promise<IPaginateResult<OrderAdminDto>> {
		const [result, total] = await this.orderRepository.findAndCount({
			relations: orderRelations,
			withDeleted: true,
			order: { created_at: 'DESC' },
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(OrderAdminDto, result, total, getListDto);
	}

	async changeOrderStatus(id: number, payload: ChangeOrderStatusDto) {
		const order = await this.orderRepository.findOne({
			where: { id }
		});
		if (!order) {
			throw new NotFoundException('Заказ не найден');
		}
		order.status = payload.status;
		const updatedOrder = await this.orderRepository.save(order);
		return convertToJson(OrderDto, updatedOrder);
	}
}
