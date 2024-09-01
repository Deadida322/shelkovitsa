import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	OneToMany,
	OneToOne,
	ManyToOne
} from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { ProductFile } from './ProductFile';
import { ProductSize } from './ProductSize';
import { ProductColor } from './ProductColor';
import { ProductSubcategory } from './ProductSubcategory';
import { OrderProduct } from './OrderProduct';

@Entity()
export class Product extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column({ nullable: true })
	description?: string;

	@Column({ nullable: true })
	logo?: string;

	@Column({ unique: true })
	article!: string;

	@Column({
		type: 'decimal'
	})
	price!: number;

	@Type(() => ProductFile)
	@OneToMany(() => ProductFile, (productFile) => productFile.product, {
		eager: true
	})
	productFiles?: ProductFile[];

	@Type(() => ProductSize)
	@OneToMany(() => ProductSize, (productSize) => productSize.product, {
		eager: true
	})
	productSizes?: ProductSize[];

	@Type(() => ProductColor)
	@OneToMany(() => ProductColor, (productColor) => productColor.product, {
		eager: true
	})
	productColors?: ProductColor[];

	@Type(() => ProductSubcategory)
	@ManyToOne(
		() => ProductSubcategory,
		(productSubcategory) => productSubcategory.products,
		{
			eager: true
		}
	)
	productSubcategory?: ProductSubcategory;

	@Type(() => OrderProduct)
	@OneToMany(() => OrderProduct, (orderProduct) => orderProduct.product)
	orderProducts?: OrderProduct[];
}
