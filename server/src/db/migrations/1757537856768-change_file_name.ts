import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFileName1757537856768 implements MigrationInterface {
    name = 'ChangeFileName1757537856768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_file" RENAME COLUMN "image" TO "name"`);
        await queryRunner.query(`ALTER TABLE "product_color" ADD "image" character varying`);
        await queryRunner.query(`ALTER TABLE "product_color" ADD "url" character varying`);
        await queryRunner.query(`ALTER TABLE "product_article" ADD "country" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_article" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "product_color" DROP COLUMN "url"`);
        await queryRunner.query(`ALTER TABLE "product_color" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "product_file" RENAME COLUMN "name" TO "image"`);
    }

}
