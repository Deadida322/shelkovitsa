import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductColor } from './ProductColor';

@Entity()
export class Color extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	name!: string;

	@Type(() => ProductColor)
	@OneToMany(() => ProductColor, (productColor) => productColor.color)
	productColors?: ProductColor[];
}
