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
import { Order } from './Order';

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	fio!: string;

	@Column({ unique: true })
	mail!: string;

	@Column()
	password!: string;

	@Column({
		type: 'json',
		nullable: true
	})
	basket!: string;

	@Type(() => Order)
	@ManyToOne(() => Order, (order) => order.user)
	orders?: Order[];
}
