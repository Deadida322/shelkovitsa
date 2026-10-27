import { Injectable, Logger, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Telegram } from 'telegraf';
import { TELEGRAM } from './telegram.constants';
import { In, LessThan, Repository } from 'typeorm';
import { Order } from 'src/db/entities/Order';
import {
	TelegramMessageStatus,
	TelegramOrderMessage
} from 'src/db/entities/TelegramOrderMessage';
import { orderRelations } from 'src/order/order.relations';

// Уведомления о заказах в Telegram: отправка, учёт статуса, повторные попытки
@Injectable()
export class OrderNotificationService implements OnApplicationShutdown {
	private readonly logger = new Logger(OrderNotificationService.name);
	private readonly pendingNotifications = new Set<Promise<void>>();

	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@InjectRepository(TelegramOrderMessage)
		private readonly telegramMessageRepository: Repository<TelegramOrderMessage>,
		@Inject(TELEGRAM)
		private readonly telegram: Telegram | null,
		private readonly configService: ConfigService
	) {}

	// Отправка в фоне, не блокируя ответ клиенту
	notifyOrderCreated(order: Order) {
		const tracked = this.sendTgCreateOrder(order)
			.catch((error) => {
				this.logger.error(
					'Ошибка при асинхронной отправке Telegram сообщения',
					error?.stack ?? error
				);
			})
			.finally(() => this.pendingNotifications.delete(tracked));
		this.pendingNotifications.add(tracked);
	}

	async waitForPendingNotifications() {
		await Promise.allSettled([...this.pendingNotifications]);
	}

	// Дожидаемся фоновых отправок при остановке, чтобы не оборвать запись статуса
	async onApplicationShutdown() {
		await this.waitForPendingNotifications();
	}

	private isTelegramEnabled(): boolean {
		return this.configService.get<string>('TELEGRAM_ENABLED') !== 'false';
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
		if (!this.telegram) {
			await this.updateTelegramStatus(
				newOrder.id,
				TelegramMessageStatus.FAILED,
				null,
				'Telegram бот недоступен'
			);
			return;
		}

		const chatTgIdRaw = this.configService.get<string>('CHAT_TG_ID');
		if (!chatTgIdRaw) {
			await this.updateTelegramStatus(
				newOrder.id,
				TelegramMessageStatus.FAILED,
				null,
				'CHAT_TG_ID не настроен'
			);
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
			const chatTgId = /^-?\d+$/.test(trimmedId) ? Number(trimmedId) : trimmedId;

			this.logger.log(
				`Отправка сообщения в Telegram чат с ID: ${chatTgId} (тип: ${typeof chatTgId})`
			);

			const html = [
				`<u>Новый заказ #${newOrder.id}:</u>\n`,
				`<strong>Сумма:</strong> ${newOrder.price}\n`,
				`<strong>Кол-во позиций:</strong> ${newOrder.orderProducts?.length || 0}\n`
			];

			const parse_html = html.join('');
			const message = await this.telegram.sendMessage(chatTgId, parse_html, {
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

			this.logger.log(
				`✅ Telegram сообщение успешно отправлено для заказа #${newOrder.id}, message_id: ${message.message_id}`
			);
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
				this.logger.error(
					`\n⚠️  Группа была преобразована в супергруппу!\n` +
						`Старый ID: ${chatTgIdRaw}\n` +
						`Нужно обновить CHAT_TG_ID в .env файле на новый ID супергруппы.\n` +
						`Новый ID можно увидеть в URL группы в Telegram Web (после #): web.telegram.org/k/#-XXXXXXXXXX\n`
				);
			} else if (errorMessage?.includes('chat not found')) {
				this.logger.error(
					`\n❌ Чат не найден. Проверьте:\n` +
						`1. CHAT_TG_ID в .env: ${chatTgIdRaw || 'не установлен'}\n` +
						`2. Бот добавлен в группу и имеет права на отправку сообщений\n` +
						`3. Если группа была преобразована в супергруппу - обновите ID\n` +
						`   (ID виден в URL Telegram Web после символа #)\n`
				);
			} else {
				this.logger.error(
					`❌ Ошибка при отправке сообщения в Telegram для заказа #${newOrder.id}:`,
					errorMessage
				);
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
					this.logger.error(`Заказ #${orderId} не найден`);
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
			this.logger.error(
				`Ошибка при обновлении статуса Telegram для заказа #${orderId}:`,
				error
			);
		}
	}

	/**
	 * Реотправка Telegram сообщения для заказа
	 */
	async retryTelegramMessage(
		orderId: number
	): Promise<{ success: boolean; message?: string }> {
		const order = await this.orderRepository.findOne({
			where: { id: orderId },
			relations: orderRelations,
			withDeleted: true
		});

		if (!order) {
			return { success: false, message: 'Заказ не найден' };
		}

		if (!this.isTelegramEnabled()) {
			return {
				success: false,
				message: 'Telegram отключен (TELEGRAM_ENABLED=false)'
			};
		}

		if (!this.telegram) {
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
				id: In(orderIds)
			},
			relations: orderRelations,
			withDeleted: true,
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
			this.logger.log(
				'[Cron] Telegram отключен (TELEGRAM_ENABLED=false), пропуск автоматической реотправки'
			);
			return;
		}

		if (!this.telegram) {
			this.logger.log(
				'[Cron] Telegram бот недоступен, пропуск автоматической реотправки'
			);
			return;
		}

		const chatTgIdRaw = this.configService.get<string>('CHAT_TG_ID');
		if (!chatTgIdRaw) {
			this.logger.log(
				'[Cron] CHAT_TG_ID не настроен, пропуск автоматической реотправки'
			);
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
				this.logger.log('[Cron] Нет неотправленных сообщений для реотправки');
				return;
			}

			this.logger.log(
				`[Cron] Найдено ${failedMessages.length} неотправленных сообщений. Начинаю реотправку...`
			);

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
						this.logger.log(
							`[Cron] ✅ Успешно отправлено сообщение для заказа #${telegramMessage.order.id}`
						);
					} else {
						failCount++;
					}
				} catch (error: any) {
					failCount++;
					this.logger.error(
						`[Cron] ❌ Ошибка при реотправке сообщения для заказа #${telegramMessage.order.id}:`,
						error.message
					);
				}
			}

			this.logger.log(
				`[Cron] Реотправка завершена. Успешно: ${successCount}, Ошибок: ${failCount}, Всего: ${failedMessages.length}`
			);
		} catch (error: any) {
			this.logger.error(
				'[Cron] Критическая ошибка при автоматической реотправке:',
				error
			);
		}
	}
}
