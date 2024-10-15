import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductSize } from './ProductSize';
import { ProductColor } from './ProductColor';
import { OrderProduct } from './OrderProduct';
import { ProductArticle } from './ProductArticle';
import { ProductFile } from './ProductFile';

@Entity()
export class Product extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ default: 0 })
	amount!: number;

	@Type(() => ProductArticle)
	@ManyToOne(() => ProductArticle, (productArticle) => productArticle.products, {
		eager: true
	})
	productArticle?: ProductArticle;

	@Type(() => ProductSize)
	@ManyToOne(() => ProductSize, (productSize) => productSize.products, {
		eager: true
	})
	productSize?: ProductSize;

	@Type(() => ProductColor)
	@ManyToOne(() => ProductColor, (productColor) => productColor.products, {
		eager: true
	})
	productColor?: ProductColor[];

	@Type(() => OrderProduct)
	@OneToMany(() => OrderProduct, (orderProduct) => orderProduct.product)
	orderProducts?: OrderProduct[];
}
