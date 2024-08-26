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
import { Size } from './Size';

@Entity()
export class ProductSize extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Type(() => Product)
	@ManyToOne(() => Product, (product) => product.productSizes)
	product: Product;

	@Type(() => Size)
	@ManyToOne(() => Size, (size) => size.productSizes, { eager: true })
	size: Size;
}
