import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToOne,
	Index,
	JoinColumn
} from 'typeorm';
import { Type } from 'class-transformer';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

@Entity()
export class PasswordResetToken extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Type(() => User)
	@ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn()
	user!: User;

	@Index({ unique: true })
	@Column()
	tokenHash!: string;

	@Column({ type: 'timestamptz' })
	expiresAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	usedAt?: Date | null;
}
