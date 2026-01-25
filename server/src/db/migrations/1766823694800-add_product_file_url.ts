import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductFileUrl1766823694800 implements MigrationInterface {
    name = 'AddProductFileUrl1766823694800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_file" ADD "url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_file" DROP COLUMN "url"`);
    }

}
