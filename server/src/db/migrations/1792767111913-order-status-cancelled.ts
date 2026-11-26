import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderStatusCancelled1792767111913 implements MigrationInterface {
	name = 'OrderStatusCancelled1792767111913';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// PG 12+: ADD VALUE допустим в транзакции; значение доступно после commit миграции
		await queryRunner.query(
			`ALTER TYPE "public"."order_status_enum" ADD VALUE IF NOT EXISTS 'cancelled'`
		);
	}

	public async down(): Promise<void> {
		// Удаление значения из enum Postgres не поддерживается без пересоздания типа
	}
}
