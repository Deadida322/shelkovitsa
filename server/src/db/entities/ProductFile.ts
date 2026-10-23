import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
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
		nullable: true
	})
	url?: string;

	@Column({
		default: false
	})
	isLogo!: boolean;

	@Type(() => ProductArticle)
	@Index()
	@ManyToOne(() => ProductArticle, (productArticle) => productArticle.productFiles, {
		onDelete: 'CASCADE',
		nullable: false
	})
	productArticle: ProductArticle;
}
