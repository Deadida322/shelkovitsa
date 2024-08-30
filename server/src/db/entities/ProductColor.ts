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

@Entity()
export class ProductColor extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ default: 0 })
	amount!: number;

	@Type(() => Product)
	@ManyToOne(() => Product, (product) => product.productColors)
	product: Product;

	@Column()
	name!: string;
}
