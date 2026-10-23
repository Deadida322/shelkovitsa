import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { moneyColumn } from './transformers';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Product } from './Product';
import { Order } from './Order';

@Entity()
export class OrderProduct extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column(moneyColumn)
	price!: number;

	@Column()
	amount!: number;

	@Type(() => Product)
	@ManyToOne(() => Product, (product) => product.orderProducts, {
		eager: true,
		nullable: false
	})
	product!: Product;

	@Index()
	@Type(() => Order)
	@ManyToOne(() => Order, (order) => order.orderProducts, {
		nullable: false
	})
	order!: Order;
}
