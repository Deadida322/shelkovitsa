import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { ProductSize } from './ProductSize';
import { Type } from 'class-transformer';

@Entity()
export class Size extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Type(() => ProductSize)
	@OneToMany(() => ProductSize, (productSize) => productSize.size)
	productSizes?: ProductSize[];
}
