import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	OneToMany,
	OneToOne,
	ManyToOne
} from 'typeorm';
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
		eager: true
	})
	product!: Product;

	@Type(() => Order)
	@ManyToOne(() => Order, (order) => order.orderProducts)
	order!: Order;
}
