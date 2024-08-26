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
import { Product } from './Product';

@Entity()
export class ProductFile extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	image!: string;

	@Type(() => Product)
	@ManyToOne(() => Product, (product) => product.productFiles)
	product: Product;
}
