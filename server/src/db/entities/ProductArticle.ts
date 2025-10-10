import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductSubcategory } from './ProductSubcategory';
import { Product } from './Product';
import { ProductFile } from './ProductFile';

@Entity()
export class ProductArticle extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: true })
	name?: string;

	@Column({ nullable: true })
	country?: string;

	@Column({ nullable: true })
	description?: string;

	@Column({ unique: true })
	article!: string;

	@Column({
		type: 'decimal'
	})
	price!: number;

	@Column({
		default: false
	})
	isVisible!: boolean;

	@Type(() => Product)
	@OneToMany(() => Product, (product) => product.productArticle)
	products?: Product[];

	@Type(() => ProductSubcategory)
	@ManyToOne(
		() => ProductSubcategory,
		(productSubcategory) => productSubcategory.productArticles,
		{
			eager: true
		}
	)
	productSubcategory?: ProductSubcategory;

	@Type(() => ProductFile)
	@OneToMany(() => ProductFile, (productFile) => productFile.product, {
		eager: true
	})
	productFiles?: ProductFile[];
}
