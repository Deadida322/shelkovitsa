import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { OrderProduct } from './OrderProduct';
import { DeliveryType } from './DeliveryType';
import { User } from './User';

export enum OrderStatus {
	CREATE = 'create',
	PAYMENT = 'payment',
	CLOSE = 'close'
}

@Entity()
export class Order extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	fio!: string;

	@Column()
	mail!: string;

	@Column()
	tel!: string;

	@Column()
	description!: string;

	@Column()
	region!: string;

	@Column()
	address!: string;

	@Column()
	price!: number;

	@Type(() => DeliveryType)
	@ManyToOne(() => DeliveryType, (deliveryType) => deliveryType.orders, {
		eager: true
	})
	deliveryType!: DeliveryType;

	@Type(() => OrderProduct)
	@OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, {
		eager: true
	})
	orderProducts?: OrderProduct[];

	@Type(() => User)
	@OneToMany(() => User, (user) => user.orders, {
		eager: true
	})
	user!: User;

	@Column({
		type: 'enum',
		enum: OrderStatus,
		default: OrderStatus.CREATE
	})
	status: OrderStatus;
}
