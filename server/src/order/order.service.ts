import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { AuditService } from 'src/audit/audit.service';
import { AuditActions, AuditActor } from 'src/audit/audit.types';
import { Order, OrderStatus } from 'src/db/entities/Order';
import {
	TelegramMessageStatus,
	TelegramOrderMessage
} from 'src/db/entities/TelegramOrderMessage';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';
import { User } from 'src/db/entities/User';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { baseProductWhere } from 'src/product-article/product-article.types';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { ChangeOrderStatusDto } from './dto/ChangeOrderStatusDto';
import {
	ACTIVE_ORDER_STATUSES,
	COMPLETED_ORDER_STATUSES,
	GetCustomerOrderListDto
} from './dto/GetCustomerOrderListDto';
import { GetAdminOrderListDto } from './dto/GetAdminOrderListDto';
import { canTransition } from './order-status.transitions';
import { orderRelations } from './order.relations';

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		private readonly dataSource: DataSource,
		private readonly notifications: OrderNotificationService,
		private readonly audit: AuditService
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

		const newOrder = await this.orderRepository.findOneOrFail({
			where: { id: orderId },
			relations: orderRelations,
			withDeleted: true
		});

		this.notifications.notifyOrderCreated(newOrder);

		this.audit.record({
			actor: { id: userId, mail: createOrderDto.mail },
			action: AuditActions.ORDER_CREATE,
			entity: 'order',
			entityId: orderId,
			meta: {
				price: newOrder.price,
				items: createOrderDto.orderProducts.length,
				guest: !userId
			}
		});

		return newOrder;
	}

	async getOrderList(
		getListDto: GetCustomerOrderListDto,
		userId: number
	): Promise<IPaginateResult<Order>> {
		const scope = getListDto.scope ?? 'active';
		const statuses =
			scope === 'completed' ? COMPLETED_ORDER_STATUSES : ACTIVE_ORDER_STATUSES;

		const [result, total] = await this.orderRepository.findAndCount({
			where: {
				user: {
					id: userId
				},
				status: In(statuses)
			},
			relations: orderRelations,
			// позиции с товарами из архива остаются в заказе
			withDeleted: true,
			order: { created_at: 'DESC' },
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(result, total, getListDto);
	}

	async getAdminOrderList(
		getListDto: GetAdminOrderListDto
	): Promise<IPaginateResult<Order>> {
		const qb = this.orderRepository
			.createQueryBuilder('order')
			.leftJoin('order.deliveryType', 'deliveryType');

		const query = getListDto.query?.trim();
		if (query) {
			qb.andWhere(
				new Brackets((where) => {
					where
						.orWhere('order.fio ILIKE :search')
						.orWhere('order.mail ILIKE :search')
						.orWhere('order.tel ILIKE :search');
				}),
				{ search: `%${escapeLike(query)}%` }
			);
		}

		if (getListDto.status) {
			qb.andWhere('order.status = :status', { status: getListDto.status });
		}

		if (getListDto.deliveryTypeId != null) {
			qb.andWhere('deliveryType.id = :deliveryTypeId', {
				deliveryTypeId: getListDto.deliveryTypeId
			});
		}

		const total = await qb.clone().getCount();

		const pageOrders = await qb
			.orderBy('order.created_at', 'DESC')
			.skip(getListDto.itemsPerPage * getListDto.page)
			.take(getListDto.itemsPerPage)
			.getMany();

		if (pageOrders.length === 0) {
			return getPaginateResult([], total, getListDto);
		}

		const ids = pageOrders.map((order) => order.id);
		const loaded = await this.orderRepository.find({
			where: { id: In(ids) },
			relations: orderRelations,
			withDeleted: true
		});
		const byId = new Map(loaded.map((order) => [order.id, order]));
		const result = ids
			.map((id) => byId.get(id))
			.filter((order): order is Order => Boolean(order));

		return getPaginateResult(result, total, getListDto);
	}

	async changeOrderStatus(
		id: number,
		payload: ChangeOrderStatusDto,
		actor?: AuditActor
	) {
		const previousStatus = await this.dataSource.transaction(async (manager) => {
			const order = await manager
				.createQueryBuilder(Order, 'order')
				.setLock('pessimistic_write')
				.where('order.id = :id', { id })
				.getOne();
			if (!order) {
				throw new NotFoundException('Заказ не найден');
			}
			if (!canTransition(order.status, payload.status)) {
				throw new BadRequestException(
					`Нельзя сменить статус с «${order.status}» на «${payload.status}»`
				);
			}

			const fromStatus = order.status;

			if (payload.status === OrderStatus.CANCELLED) {
				const orderProducts = await manager.find(OrderProduct, {
					where: { order: { id } }
				});
				for (const op of orderProducts) {
					await manager.increment(
						Product,
						{ id: op.product.id },
						'amount',
						op.amount
					);
				}
			} else if (order.status === OrderStatus.CANCELLED) {
				const orderProducts = await manager.find(OrderProduct, {
					where: { order: { id } }
				});
				const productIds = [...new Set(orderProducts.map((op) => op.product.id))];
				if (productIds.length > 0) {
					const lockedProducts = await manager
						.createQueryBuilder(Product, 'product')
						.setLock('pessimistic_write')
						.where('product.id IN (:...productIds)', { productIds })
						.getMany();
					const amountById = new Map(
						lockedProducts.map((p) => [p.id, p.amount])
					);

					for (const op of orderProducts) {
						const available = amountById.get(op.product.id) ?? 0;
						if (op.amount > available) {
							throw new BadRequestException(
								`Недостаточное кол-во на складе для восстановления заказа`
							);
						}
					}

					for (const op of orderProducts) {
						await manager.decrement(
							Product,
							{ id: op.product.id },
							'amount',
							op.amount
						);
					}
				}
			}

			order.status = payload.status;
			await manager.save(order);
			return fromStatus;
		});

		this.audit.record({
			actor,
			action: AuditActions.ORDER_STATUS_CHANGE,
			entity: 'order',
			entityId: id,
			meta: { from: previousStatus, to: payload.status }
		});

		return this.orderRepository.findOneOrFail({
			where: { id },
			relations: orderRelations,
			withDeleted: true
		});
	}
}
