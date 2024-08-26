import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColor1724682028810 implements MigrationInterface {
    name = 'AddColor1724682028810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "color" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_229c1a96f14d7187fccf3684ecc" UNIQUE ("name"), CONSTRAINT "PK_d15e531d60a550fbf23e1832343" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_color" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "productId" integer, "colorId" integer, CONSTRAINT "PK_e586d22a197c9b985af3ac82ce3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_color" ADD CONSTRAINT "FK_7a1cefb85fba910888cf9a1a634" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_color" ADD CONSTRAINT "FK_d76b385a61478aa9c5c6408f337" FOREIGN KEY ("colorId") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_color" DROP CONSTRAINT "FK_d76b385a61478aa9c5c6408f337"`);
        await queryRunner.query(`ALTER TABLE "product_color" DROP CONSTRAINT "FK_7a1cefb85fba910888cf9a1a634"`);
        await queryRunner.query(`DROP TABLE "product_color"`);
        await queryRunner.query(`DROP TABLE "color"`);
    }

}
