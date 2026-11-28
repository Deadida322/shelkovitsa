import { MigrationInterface, QueryRunner } from 'typeorm';

export class PgTrgmSearch1792767111915 implements MigrationInterface {
	name = 'PgTrgmSearch1792767111915';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_article_name_trgm" ON "product_article" USING gin (name gin_trgm_ops)`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_article_brand_trgm" ON "product_article" USING gin (brand gin_trgm_ops)`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_article_article_trgm" ON "product_article" USING gin (article gin_trgm_ops)`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_article_brand_lower" ON "product_article" (LOWER(brand))`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_product_article_brand_lower"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_article_article_trgm"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_article_brand_trgm"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_article_name_trgm"`);
	}
}