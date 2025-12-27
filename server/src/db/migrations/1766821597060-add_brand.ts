import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBrand1766821597060 implements MigrationInterface {
    name = 'AddBrand1766821597060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_article" ADD "brand" character varying`);
        await queryRunner.query(`ALTER TABLE "product_article" ADD "composition" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_article" DROP COLUMN "composition"`);
        await queryRunner.query(`ALTER TABLE "product_article" DROP COLUMN "brand"`);
    }

}
