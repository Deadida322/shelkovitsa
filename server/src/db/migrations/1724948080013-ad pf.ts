import { MigrationInterface, QueryRunner } from "typeorm";

export class AdPf1724948080013 implements MigrationInterface {
    name = 'AdPf1724948080013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "product_color" ADD "amount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "ordersId" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_95a35edcd3803de3a0c851ab3e7" FOREIGN KEY ("ordersId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_95a35edcd3803de3a0c851ab3e7"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "ordersId"`);
        await queryRunner.query(`ALTER TABLE "product_color" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "amount" integer NOT NULL DEFAULT '0'`);
    }

}
