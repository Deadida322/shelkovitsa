import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Product } from './Product';

@Entity()
export class ProductSize extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Type(() => Product)
	@OneToMany(() => Product, (product) => product.productSize)
	products: Product[];
}
