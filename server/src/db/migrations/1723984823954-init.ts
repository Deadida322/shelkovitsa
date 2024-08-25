import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1723984823954 implements MigrationInterface {
    name = 'Init1723984823954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "article" character varying NOT NULL, CONSTRAINT "UQ_e6bad5d08f4ab9bdecedb8a97fd" UNIQUE ("article"), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
