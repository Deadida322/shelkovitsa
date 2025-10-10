import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductArticle } from './ProductArticle';

@Entity()
export class ProductFile extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column({
		default: false
	})
	isLogo!: boolean;

	@Type(() => ProductArticle)
	@ManyToOne(() => ProductArticle, (productArticle) => productArticle.productFiles)
	product: ProductArticle;
}
