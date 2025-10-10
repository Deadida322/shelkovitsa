import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Product } from './Product';

@Entity()
export class ProductColor extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Type(() => Product)
	@OneToMany(() => Product, (product) => product.productColor)
	products: Product[];

	@Column({
		unique: true
	})
	name!: string;

	@Column({
		nullable: true
	})
	image?: string;

	@Column({
		nullable: true
	})
	url?: string;
}
