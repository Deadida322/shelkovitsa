import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductSubcategory } from './ProductSubcategory';
import { Product } from './Product';

@Entity()
export class ProductArticle extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: true })
	name?: string;

	@Column({ nullable: true })
	description?: string;

	@Column({ nullable: true })
	logo?: string;

	@Column({ unique: true })
	article!: string;

	@Type(() => Product)
	@OneToMany(() => Product, (product) => product.productArticle)
	products?: Product[];

	@Type(() => ProductSubcategory)
	@ManyToOne(
		() => ProductSubcategory,
		(productSubcategory) => productSubcategory.pProductArticles,
		{
			eager: true
		}
	)
	productSubcategory?: ProductSubcategory;
}
