import { MigrationInterface, QueryRunner } from 'typeorm';

export class PricesToKopecks1792767111912 implements MigrationInterface {
	name = 'PricesToKopecks1792767111912';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// numeric(12,2) рубли → bigint копейки
		await queryRunner.query(`
			ALTER TABLE "product_article"
			ALTER COLUMN "price" TYPE bigint
			USING (ROUND("price" * 100))::bigint
		`);
		await queryRunner.query(`
			ALTER TABLE "order_product"
			ALTER COLUMN "price" TYPE bigint
			USING (ROUND("price" * 100))::bigint
		`);
		await queryRunner.query(`
			ALTER TABLE "order"
			ALTER COLUMN "price" TYPE bigint
			USING (ROUND("price" * 100))::bigint
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "product_article"
			ALTER COLUMN "price" TYPE numeric(12,2)
			USING (("price")::numeric / 100)
		`);
		await queryRunner.query(`
			ALTER TABLE "order_product"
			ALTER COLUMN "price" TYPE numeric(12,2)
			USING (("price")::numeric / 100)
		`);
		await queryRunner.query(`
			ALTER TABLE "order"
			ALTER COLUMN "price" TYPE numeric(12,2)
			USING (("price")::numeric / 100)
		`);
	}
}
