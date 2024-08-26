import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Product } from './Product';
import { ProductCategory } from './ProductCategory';

@Entity()
export class ProductSubcategory extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Type(() => Product)
	@OneToMany(() => Product, (product) => product.productSubcategory)
	products?: Product[];

	@Type(() => ProductCategory)
	@ManyToOne(
		() => ProductCategory,
		(productCategory) => productCategory.productSubcategories,
		{
			eager: true
		}
	)
	productCategory: ProductCategory;
}
