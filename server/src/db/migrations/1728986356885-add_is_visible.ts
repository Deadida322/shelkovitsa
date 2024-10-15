import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsVisible1728986356885 implements MigrationInterface {
    name = 'AddIsVisible1728986356885'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_article" ADD "isVisible" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_article" DROP COLUMN "isVisible"`);
    }

}
