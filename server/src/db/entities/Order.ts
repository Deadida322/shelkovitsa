import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { OrderProduct } from './OrderProduct';
import { DeliveryType } from './DeliveryType';
import { User } from './User';

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
}
