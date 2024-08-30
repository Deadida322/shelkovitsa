import { MigrationInterface, QueryRunner } from 'typeorm';

export class RmColor1724949626410 implements MigrationInterface {
	name = 'RmColor1724949626410';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "UQ_e6bad5d08f4ab9bdecedb8a97fd" UNIQUE ("article")`
		);
		await queryRunner.query(`DROP TABLE "color"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "UQ_e6bad5d08f4ab9bdecedb8a97fd"`
		);
		await queryRunner.query(
			`CREATE TABLE "color" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_229c1a96f14d7187fccf3684ecc" UNIQUE ("name"), CONSTRAINT "PK_d15e531d60a550fbf23e1832343" PRIMARY KEY ("id"))`
		);
	}
}
