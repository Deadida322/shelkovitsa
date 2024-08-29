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
import { Color } from './Color';

@Entity()
export class ProductColor extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ default: 0 })
	amount!: number;

	@Type(() => Product)
	@ManyToOne(() => Product, (product) => product.productColors)
	product: Product;

	@Type(() => Color)
	@ManyToOne(() => Color, (color) => color.productColors, { eager: true })
	color: Color;
}
