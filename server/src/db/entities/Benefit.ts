import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity()
export class Benefit extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	name!: string;

	@Column()
	description!: string;

	@Column({ nullable: true })
	logo?: string;
}
