import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	OneToMany,
	ManyToOne,
	Index
} from 'typeorm';
import { moneyColumn } from './transformers';
import { SoftDeleteEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductSubcategory } from './ProductSubcategory';
import { Product } from './Product';
import { ProductFile } from './ProductFile';

@Entity()
export class ProductArticle extends SoftDeleteEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: true })
	name?: string;

	@Column({ nullable: true })
	country?: string;

	@Column({ nullable: true })
	description?: string;

	@Column({ nullable: true })
	brand?: string;

	@Column({ nullable: true })
	composition?: string;

	@Column({ unique: true })
	article!: string;

	@Column(moneyColumn)
	price!: number;

	@Column({
		default: false
	})
	isVisible!: boolean;

	@Type(() => Product)
	@OneToMany(() => Product, (product) => product.productArticle)
	products?: Product[];

	@Index()
	@Type(() => ProductSubcategory)
	@ManyToOne(
		() => ProductSubcategory,
		(productSubcategory) => productSubcategory.productArticles,
		{
			eager: true,
			nullable: false
		}
	)
	productSubcategory?: ProductSubcategory;

	@Type(() => ProductFile)
	@OneToMany(() => ProductFile, (productFile) => productFile.productArticle, {
		eager: true
	})
	productFiles?: ProductFile[];
}
