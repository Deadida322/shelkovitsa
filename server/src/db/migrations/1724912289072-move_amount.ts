import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveAmount1724912289072 implements MigrationInterface {
    name = 'MoveAmount1724912289072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_file" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "image" character varying NOT NULL, "productId" integer, CONSTRAINT "PK_16c46f3319e6d4117fb4994b91f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "benefit" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "logo" character varying, CONSTRAINT "UQ_451e7b9e844f208c6183c239a5d" UNIQUE ("name"), CONSTRAINT "PK_c024dccb30e6f4702adffe884d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "product_color" ADD "amount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "product" ADD "logo" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "ordersId" integer`);
        await queryRunner.query(`ALTER TABLE "product_file" ADD CONSTRAINT "FK_8908c9d576061144b562635769f" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_95a35edcd3803de3a0c851ab3e7" FOREIGN KEY ("ordersId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_95a35edcd3803de3a0c851ab3e7"`);
        await queryRunner.query(`ALTER TABLE "product_file" DROP CONSTRAINT "FK_8908c9d576061144b562635769f"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "ordersId"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "logo"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "product_color" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "amount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP TABLE "benefit"`);
        await queryRunner.query(`DROP TABLE "product_file"`);
    }

}
