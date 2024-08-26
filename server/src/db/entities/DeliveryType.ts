import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Order } from './Order';

@Entity()
export class DeliveryType extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	name!: string;

	@Column({ nullable: true })
	description?: string;

	@Type(() => Order)
	@OneToMany(() => Order, (order) => order.deliveryType)
	orders?: Order[];
}
