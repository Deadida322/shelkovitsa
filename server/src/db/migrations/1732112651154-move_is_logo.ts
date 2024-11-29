import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveIsLogo1732112651154 implements MigrationInterface {
    name = 'MoveIsLogo1732112651154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_article" DROP COLUMN "logo"`);
        await queryRunner.query(`ALTER TABLE "product_file" ADD "isLogo" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product_category" ADD CONSTRAINT "UQ_96152d453aaea425b5afde3ae9f" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_category" DROP CONSTRAINT "UQ_96152d453aaea425b5afde3ae9f"`);
        await queryRunner.query(`ALTER TABLE "product_file" DROP COLUMN "isLogo"`);
        await queryRunner.query(`ALTER TABLE "product_article" ADD "logo" character varying`);
    }

}
