import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeOpPrice1734705231774 implements MigrationInterface {
    name = 'ChangeOpPrice1734705231774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_product" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD "price" numeric NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_product" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD "price" integer NOT NULL`);
    }

}
