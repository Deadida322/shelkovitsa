import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
	@CreateDateColumn({ type: 'timestamptz' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamptz' })
	updated_at!: Date;
}

// Мягкое удаление — только для сущностей, на которые ссылаются заказы
// (пользователи, артикулы, варианты товара). TypeORM сам исключает их из выборок;
// чтобы увидеть удалённые, нужен withDeleted: true.
export abstract class SoftDeleteEntity extends BaseEntity {
	@DeleteDateColumn({ type: 'timestamptz', nullable: true })
	deleted_at?: Date | null;
}
