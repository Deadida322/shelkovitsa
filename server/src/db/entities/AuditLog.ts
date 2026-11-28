import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn
} from 'typeorm';

@Entity('audit_log')
export class AuditLog {
	@PrimaryGeneratedColumn()
	id!: number;

	@CreateDateColumn({ type: 'timestamptz' })
	@Index()
	created_at!: Date;

	@Column({ type: 'int', nullable: true })
	@Index()
	actorId!: number | null;

	@Column({ type: 'varchar', nullable: true })
	actorMail!: string | null;

	/** Например order.create, auth.register */
	@Column({ type: 'varchar', length: 64 })
	@Index()
	action!: string;

	/** order | user | product_article | product_category | … */
	@Column({ type: 'varchar', length: 64 })
	@Index()
	entity!: string;

	@Column({ type: 'varchar', length: 64, nullable: true })
	entityId!: string | null;

	/** Компактный JSON: без паролей и больших payload */
	@Column({ type: 'jsonb', nullable: true })
	meta!: Record<string, unknown> | null;
}
