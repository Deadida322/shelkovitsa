import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	OneToMany,
	ManyToOne,
	Unique
} from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductCategory } from './ProductCategory';
import { ProductArticle } from './ProductArticle';

@Entity()
// одинаковые подкатегории («Трусы», «Боди») бывают в разных категориях
@Unique(['productCategory', 'name'])
export class ProductSubcategory extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Type(() => ProductArticle)
	@OneToMany(
		() => ProductArticle,
		(productArticle) => productArticle.productSubcategory
	)
	productArticles?: ProductArticle[];

	@Type(() => ProductCategory)
	@ManyToOne(
		() => ProductCategory,
		(productCategory) => productCategory.productSubcategories,
		{
			eager: true,
			nullable: false
		}
	)
	productCategory: ProductCategory;
}
