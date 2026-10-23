import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	OneToMany,
	ManyToOne,
	Unique
} from 'typeorm';
import { SoftDeleteEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductSize } from './ProductSize';
import { ProductColor } from './ProductColor';
import { OrderProduct } from './OrderProduct';
import { ProductArticle } from './ProductArticle';

@Entity()
// один вариант на сочетание артикул + цвет + размер
@Unique(['productArticle', 'productColor', 'productSize'])
export class Product extends SoftDeleteEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ default: 0 })
	amount!: number;

	@Type(() => ProductArticle)
	@ManyToOne(() => ProductArticle, (productArticle) => productArticle.products, {
		nullable: false
	})
	productArticle?: ProductArticle;

	@Type(() => ProductSize)
	@ManyToOne(() => ProductSize, (productSize) => productSize.products, {
		eager: true,
		nullable: false
	})
	productSize?: ProductSize;

	@Type(() => ProductColor)
	@ManyToOne(() => ProductColor, (productColor) => productColor.products, {
		eager: true,
		nullable: false
	})
	productColor?: ProductColor;

	@Type(() => OrderProduct)
	@OneToMany(() => OrderProduct, (orderProduct) => orderProduct.product)
	orderProducts?: OrderProduct[];
}
