import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Optional
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from 'src/db/entities/Order';
import { TelegramOrderMessage, TelegramMessageStatus } from 'src/db/entities/TelegramOrderMessage';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';
import { convertToJson } from 'src/helpers/convertHelper';
import { OrderDto } from './dto/OrderDto';
import { baseWhere } from 'src/common/utils';
import { GetListDto } from 'src/common/dto/GetListDto';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { OrderAdminDto } from './dto/OrderAdminDto';
import { User } from 'src/db/entities/User';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { ChangeOrderStatusDto } from './dto/ChangeOrderStatusDto';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

const orderRelations = {
	orderProducts: {
		product: {
			productArticle: true,
			productColor: true,
			productSize: true
		}
	},
	telegramMessage: true
};
@Injectable()
export class OrderService {
	private isTelegramEnabled(): boolean {
		return this.configService.get<string>('TELEGRAM_ENABLED') !== 'false';
	}

	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,
		@InjectRepository(TelegramOrderMessage)
		private readonly telegramMessageRepository: Repository<TelegramOrderMessage>,
		private readonly dataSource: DataSource,
		@Optional()
		@InjectBot()
		private readonly bot: Telegraf | undefined,
		private readonly configService: ConfigService
	) {}

	async create(createOrderDto: CreateOrderDto, userId?: number) {
		const orderProducts = createOrderDto.orderProducts.map(
			({ amount, productId }) => {
				return {
					amount,
					price: 0,
					productId
				};
			}
		);
		const dProducts = await this.productRepository.find({
			where: {
				id: In(orderProducts.map((el) => el.productId)),
				...baseWhere
			},
			relations: {
				productArticle: true
			}
		});

		//проверка на существование продукта
		const dbOrderProductsIds = dProducts.map((el) => el.id);
		if (dProducts.length != orderProducts.length) {
			const notExistProduct = orderProducts.find((op) => {
				return !dbOrderProductsIds.includes(op.productId);
			});
			throw new BadRequestException(
				`Не найден продукт ${notExistProduct.productId ?? ''}`
			);
		}
		//проверка на складские остатки
		let ops = orderProducts.map((el) => {
			const product = dProducts.find((dop) => dop.id == el.productId);
			if (!product) {
				throw new BadRequestException(`Не найден продукт ${el.productId ?? ''}`);
			}
			if (el.amount > product.amount) {
				throw new BadRequestException(
					`Недостаточное кол-во для ${product?.productArticle?.name ?? ''}, Вы можете закать только ${product.amount} единиц`
				);
			}
			return {
				amount: el.amount,
				price: Number(product.productArticle.price),
				product
			};
		});
		const price = ops.reduce(
			(acc, currentValue) => acc + currentValue.price * currentValue.amount,
			0
		);

		let payload = {
			...createOrderDto,
			price: Number(price),
			user: undefined,
			deliveryType: undefined
		};

		const queryRunner = this.dataSource.createQueryRunner();

		await queryRunner.connect();
		await queryRunner.startTransaction();
		try {
			if (userId) {
				const user = await queryRunner.manager.findOne(User, {
					where: {
						id: userId,
						...baseWhere
					}
				});
				if (user) {
					payload.user = user;
				}
			}
			const deliveryType = await queryRunner.manager.findOne(DeliveryType, {
				where: {
					id: createOrderDto.deliveryTypeId,
					...baseWhere
				}
			});
			if (!deliveryType) {
				throw new BadRequestException('Не найден тип доставки');
			}
			payload.deliveryType = deliveryType;

			const order = await queryRunner.manager.save(Order, payload);
			ops = ops.map((el) => {
				return {
					...el,
					order
				};
			});
			await queryRunner.manager.save(OrderProduct, ops);

			// Создаем запись Telegram сообщения в рамках той же транзакции
			// чтобы админ всегда видел статус отправки
			const telegramMessage = queryRunner.manager.create(TelegramOrderMessage, {
				order,
				status: TelegramMessageStatus.PENDING,
				retryCount: 0
			});
			await queryRunner.manager.save(TelegramOrderMessage, telegramMessage);

			await queryRunner.commitTransaction();

			const newOrder = await queryRunner.manager.findOne(Order, {
				where: {
					id: order.id
				},
				relations: orderRelations
			});

			// Отправляем Telegram сообщение асинхронно, не блокируя ответ
			this.sendTgCreateOrder(newOrder).catch((error) => {
				console.error('Ошибка при асинхронной отправке Telegram сообщения:', error);
			});

			return convertToJson(OrderDto, newOrder);
		} catch (err) {
			await queryRunner.rollbackTransaction();
			console.log(err);

			throw new InternalServerErrorException(err);
		} finally {
			await queryRunner.release();
		}
	}

	async getOrderList(
		getListDto: GetListDto,
		userId: number
	): Promise<IPaginateResult<OrderDto>> {
		const [result, total] = await this.orderRepository.findAndCount({
			where: {
				user: {
					id: userId
				},
				...baseWhere
			},
			relations: orderRelations,
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(OrderDto, result, total, getListDto);
	}

	async getAdminOrderList(
		getListDto: GetListDto
	): Promise<IPaginateResult<OrderAdminDto>> {
		const [result, total] = await this.orderRepository.findAndCount({
			where: {
				...baseWhere
			},
			relations: orderRelations,
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(OrderAdminDto, result, total, getListDto);
	}

	async changeOrderStatus(payload: ChangeOrderStatusDto) {
		const order = await this.orderRepository.findOne({
			where: {
				id: payload.orderId
			}
		});
		const updatedOrder = await this.orderRepository.save({
			...order,
			status: payload.status as OrderStatus
		});
		return convertToJson(OrderDto, updatedOrder);
	}

	async sendTgCreateOrder(newOrder: Order, isRetry: boolean = false) {
		if (!this.isTelegramEnabled()) {
			await this.updateTelegramStatus(
				newOrder.id,
				TelegramMessageStatus.FAILED,
				null,
				'Telegram отключен (TELEGRAM_ENABLED=false)'
			);
			return;
		}

		// Проверяем наличие бота и токена перед отправкой
		if (!this.bot) {
			await this.updateTelegramStatus(newOrder.id, TelegramMessageStatus.FAILED, null, 'Telegram бот недоступен');
			return;
		}

		const chatTgIdRaw = this.configService.get<string>('CHAT_TG_ID');
		if (!chatTgIdRaw) {
			await this.updateTelegramStatus(newOrder.id, TelegramMessageStatus.FAILED, null, 'CHAT_TG_ID не настроен');
			return;
		}

		// Устанавливаем статус "в процессе отправки"
		if (!isRetry) {
			await this.updateTelegramStatus(newOrder.id, TelegramMessageStatus.PENDING);
		} else {
			await this.updateTelegramStatus(newOrder.id, TelegramMessageStatus.RETRYING);
		}

		try {
			// Преобразуем строку в число, если это число, иначе оставляем строкой
			// Telegram принимает и числовые ID, и строковые (для каналов/групп)
			// Для групп ID отрицательный (например: -4953504334)
			const trimmedId = chatTgIdRaw.trim();
			const chatTgId = /^-?\d+$/.test(trimmedId)
				? Number(trimmedId)
				: trimmedId;
			
			console.log(`Отправка сообщения в Telegram чат с ID: ${chatTgId} (тип: ${typeof chatTgId})`);

			const html = [
				`<u>Новый заказ #${newOrder.id}:</u>\n`,
				`<strong>Сумма:</strong> ${newOrder.price}\n`,
				`<strong>Кол-во позиций:</strong> ${newOrder.orderProducts?.length || 0}\n`
			];

			const parse_html = html.join('');
			const message = await this.bot.telegram.sendMessage(chatTgId, parse_html, {
				parse_mode: 'HTML'
			});

			// Успешная отправка - сохраняем статус и ID сообщения
			await this.updateTelegramStatus(
				newOrder.id,
				TelegramMessageStatus.SENT,
				message.message_id,
				null,
				new Date()
			);

			console.log(`✅ Telegram сообщение успешно отправлено для заказа #${newOrder.id}, message_id: ${message.message_id}`);
		} catch (error: any) {
			// Обработка ошибок с сохранением статуса
			const errorMessage = error?.response?.description || error?.message || error;
			
			// Получаем текущий retryCount из базы
			const telegramMessage = await this.telegramMessageRepository.findOne({
				where: { order: { id: newOrder.id } }
			});
			const retryCount = (telegramMessage?.retryCount || 0) + 1;

			await this.updateTelegramStatus(
				newOrder.id,
				TelegramMessageStatus.FAILED,
				null,
				errorMessage,
				null,
				retryCount
			);

			if (errorMessage?.includes('upgraded to a supergroup')) {
				console.error(
					`\n⚠️  Группа была преобразована в супергруппу!\n` +
					`Старый ID: ${chatTgIdRaw}\n` +
					`Нужно обновить CHAT_TG_ID в .env файле на новый ID супергруппы.\n` +
					`Новый ID можно увидеть в URL группы в Telegram Web (после #): web.telegram.org/k/#-XXXXXXXXXX\n`
				);
			} else if (errorMessage?.includes('chat not found')) {
				console.error(
					`\n❌ Чат не найден. Проверьте:\n` +
					`1. CHAT_TG_ID в .env: ${chatTgIdRaw || 'не установлен'}\n` +
					`2. Бот добавлен в группу и имеет права на отправку сообщений\n` +
					`3. Если группа была преобразована в супергруппу - обновите ID\n` +
					`   (ID виден в URL Telegram Web после символа #)\n`
				);
			} else {
				console.error(`❌ Ошибка при отправке сообщения в Telegram для заказа #${newOrder.id}:`, errorMessage);
			}
		}
	}

	/**
	 * Обновляет статус Telegram сообщения для заказа
	 */
	private async updateTelegramStatus(
		orderId: number,
		status: TelegramMessageStatus,
		messageId: number | null = null,
		errorMessage: string | null = null,
		sentAt: Date | null = null,
		retryCount: number | null = null
	) {
		try {
			// Ищем существующую запись или создаем новую
			let telegramMessage = await this.telegramMessageRepository.findOne({
				where: { order: { id: orderId } },
				relations: ['order']
			});

			if (!telegramMessage) {
				// Создаем новую запись
				const order = await this.orderRepository.findOne({
					where: { id: orderId }
				});

				if (!order) {
					console.error(`Заказ #${orderId} не найден`);
					return;
				}

				telegramMessage = this.telegramMessageRepository.create({
					order,
					status,
					retryCount: retryCount || 0
				});
			}

			// Обновляем поля
			telegramMessage.status = status;

			if (messageId !== null) {
				telegramMessage.telegramMessageId = messageId;
			}

			if (errorMessage !== null) {
				telegramMessage.errorMessage = errorMessage;
			}

			if (sentAt !== null) {
				telegramMessage.sentAt = sentAt;
			}

			if (retryCount !== null) {
				telegramMessage.retryCount = retryCount;
			}

			await this.telegramMessageRepository.save(telegramMessage);
		} catch (error) {
			console.error(`Ошибка при обновлении статуса Telegram для заказа #${orderId}:`, error);
		}
	}

	/**
	 * Реотправка Telegram сообщения для заказа
	 */
	async retryTelegramMessage(orderId: number): Promise<{ success: boolean; message?: string }> {
		const order = await this.orderRepository.findOne({
			where: { id: orderId },
			relations: orderRelations
		});

		if (!order) {
			return { success: false, message: 'Заказ не найден' };
		}

		if (!this.isTelegramEnabled()) {
			return { success: false, message: 'Telegram отключен (TELEGRAM_ENABLED=false)' };
		}

		if (!this.bot) {
			return { success: false, message: 'Telegram бот недоступен' };
		}

		const chatTgIdRaw = this.configService.get<string>('CHAT_TG_ID');
		if (!chatTgIdRaw) {
			return { success: false, message: 'CHAT_TG_ID не настроен' };
		}

		// Получаем информацию о Telegram сообщении
		const telegramMessage = await this.telegramMessageRepository.findOne({
			where: { order: { id: orderId } }
		});

		// Проверяем, не превышен ли лимит попыток (например, 5 попыток)
		const maxRetries = 5;
		if ((telegramMessage?.retryCount || 0) >= maxRetries) {
			return {
				success: false,
				message: `Превышен лимит попыток отправки (${maxRetries}). Статус: ${telegramMessage?.status}`
			};
		}

		// Если сообщение уже успешно отправлено, не отправляем повторно
		if (telegramMessage?.status === TelegramMessageStatus.SENT) {
			return {
				success: true,
				message: `Сообщение уже успешно отправлено (message_id: ${telegramMessage.telegramMessageId})`
			};
		}

		await this.sendTgCreateOrder(order, true);

		// Проверяем результат после отправки
		const updatedTelegramMessage = await this.telegramMessageRepository.findOne({
			where: { order: { id: orderId } }
		});

		if (updatedTelegramMessage?.status === TelegramMessageStatus.SENT) {
			return {
				success: true,
				message: `Сообщение успешно отправлено (message_id: ${updatedTelegramMessage.telegramMessageId})`
			};
		} else {
			return {
				success: false,
				message: `Не удалось отправить сообщение. Ошибка: ${updatedTelegramMessage?.errorMessage || 'Неизвестная ошибка'}`
			};
		}
	}

	/**
	 * Получить список заказов с неотправленными Telegram сообщениями
	 */
	async getOrdersWithFailedTelegramMessages(): Promise<Order[]> {
		const failedMessages = await this.telegramMessageRepository.find({
			where: {
				status: TelegramMessageStatus.FAILED
			},
			relations: ['order']
		});

		const orderIds = failedMessages
			.map((msg) => msg.order?.id)
			.filter((id): id is number => id !== undefined);

		if (orderIds.length === 0) {
			return [];
		}

		return await this.orderRepository.find({
			where: {
				id: In(orderIds),
				...baseWhere
			},
			relations: orderRelations,
			order: {
				created_at: 'DESC'
			}
		});
	}

	/**
	 * Автоматическая реотправка неотправленных Telegram сообщений
	 * Выполняется каждые 20 минут
	 */
	@Cron('*/20 * * * *')
	async retryFailedTelegramMessages() {
		if (!this.isTelegramEnabled()) {
			console.log('[Cron] Telegram отключен (TELEGRAM_ENABLED=false), пропуск автоматической реотправки');
			return;
		}

		if (!this.bot) {
			console.log('[Cron] Telegram бот недоступен, пропуск автоматической реотправки');
			return;
		}

		const chatTgIdRaw = this.configService.get<string>('CHAT_TG_ID');
		if (!chatTgIdRaw) {
			console.log('[Cron] CHAT_TG_ID не настроен, пропуск автоматической реотправки');
			return;
		}

		try {
			// Получаем все неотправленные сообщения с ограничением по количеству попыток
			const maxRetries = 5;
			const failedMessages = await this.telegramMessageRepository.find({
				where: {
					status: TelegramMessageStatus.FAILED,
					retryCount: LessThan(maxRetries)
				},
				relations: ['order', 'order.orderProducts']
			});

			if (failedMessages.length === 0) {
				console.log('[Cron] Нет неотправленных сообщений для реотправки');
				return;
			}

			console.log(`[Cron] Найдено ${failedMessages.length} неотправленных сообщений. Начинаю реотправку...`);

			let successCount = 0;
			let failCount = 0;

			for (const telegramMessage of failedMessages) {
				if (!telegramMessage.order) {
					continue;
				}

				try {
					// Обновляем статус на RETRYING
					telegramMessage.status = TelegramMessageStatus.RETRYING;
					await this.telegramMessageRepository.save(telegramMessage);

					// Пытаемся отправить сообщение
					await this.sendTgCreateOrder(telegramMessage.order, true);

					// Проверяем результат
					const updatedMessage = await this.telegramMessageRepository.findOne({
						where: { id: telegramMessage.id }
					});

					if (updatedMessage?.status === TelegramMessageStatus.SENT) {
						successCount++;
						console.log(`[Cron] ✅ Успешно отправлено сообщение для заказа #${telegramMessage.order.id}`);
					} else {
						failCount++;
					}
				} catch (error: any) {
					failCount++;
					console.error(
						`[Cron] ❌ Ошибка при реотправке сообщения для заказа #${telegramMessage.order.id}:`,
						error.message
					);
				}
			}

			console.log(
				`[Cron] Реотправка завершена. Успешно: ${successCount}, Ошибок: ${failCount}, Всего: ${failedMessages.length}`
			);
		} catch (error: any) {
			console.error('[Cron] Критическая ошибка при автоматической реотправке:', error);
		}
	}

	/**
	 * Вспомогательный метод для получения ID чата
	 * Можно вызвать временно для отладки
	 */
	async getChatId(chatUsernameOrId: string | number) {
		if (!this.bot) {
			console.warn('Telegram бот недоступен');
			return;
		}

		try {
			const chat = await this.bot.telegram.getChat(chatUsernameOrId);
			console.log(`ID чата: ${chat.id}`);
			console.log(`Тип чата: ${chat.type}`);
			console.log(`Название: ${'title' in chat ? chat.title : 'N/A'}`);
			return chat.id;
		} catch (error: any) {
			console.error('Ошибка при получении информации о чате:', error.message);
		}
	}
}
