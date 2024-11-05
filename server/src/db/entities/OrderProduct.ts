import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Product } from './Product';
import { Order } from './Order';

@Entity()
export class OrderProduct extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	price!: number;

	@Column()
	amount!: number;

	@Type(() => Product)
	@ManyToOne(() => Product, (product) => product.orderProducts, {
		eager: true,
		nullable: false
	})
	product!: Product;

	@Type(() => Order)
	@ManyToOne(() => Order, (order) => order.orderProducts, {
		nullable: false
	})
	order!: Order;
}
