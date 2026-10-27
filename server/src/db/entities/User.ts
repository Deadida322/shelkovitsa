import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from './BaseEntity';
import { Type } from 'class-transformer';
import { Order } from './Order';

export enum UserRole {
	CUSTOMER = 'customer',
	ADMIN = 'admin'
}

@Entity()
export class User extends SoftDeleteEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	fio!: string;

	@Column({ unique: true })
	mail!: string;

	@Column()
	password!: string;

	@Column({
		type: 'enum',
		enum: UserRole,
		default: UserRole.CUSTOMER
	})
	role!: UserRole;

	@Column({
		type: 'jsonb',
		nullable: true
	})
	basket?: object[] | null;

	@Type(() => Order)
	@OneToMany(() => Order, (order) => order.user)
	orders?: Order[];
}
