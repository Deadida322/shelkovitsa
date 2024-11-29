import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductSubcategory } from './ProductSubcategory';

@Entity()
export class ProductCategory extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({
		unique: true
	})
	name!: string;

	@Type(() => ProductSubcategory)
	@OneToMany(
		() => ProductSubcategory,
		(productSubcategory) => productSubcategory.productCategory
	)
	productSubcategories?: ProductSubcategory[];
}
