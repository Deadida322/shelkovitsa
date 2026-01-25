import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Order } from './Order';

export enum TelegramMessageStatus {
	PENDING = 'pending', // Ожидает отправки
	SENT = 'sent', // Успешно отправлено
	FAILED = 'failed', // Ошибка отправки
	RETRYING = 'retrying' // Повторная попытка отправки
}

@Entity()
export class TelegramOrderMessage extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Type(() => Order)
	@OneToOne(() => Order, (order) => order.telegramMessage, {
		nullable: false,
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	order!: Order;

	@Column({
		type: 'enum',
		enum: TelegramMessageStatus,
		default: TelegramMessageStatus.PENDING
	})
	status!: TelegramMessageStatus;

	@Column({
		nullable: true
	})
	telegramMessageId?: number; // ID отправленного сообщения в Telegram

	@Column({
		type: 'text',
		nullable: true
	})
	errorMessage?: string; // Текст ошибки при отправке

	@Column({
		type: 'timestamp',
		nullable: true
	})
	sentAt?: Date; // Время успешной отправки

	@Column({
		type: 'int',
		default: 0
	})
	retryCount!: number; // Количество попыток отправки
}

