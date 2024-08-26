import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrder1724683730866 implements MigrationInterface {
    name = 'AddOrder1724683730866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "delivery_type" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_d106c8e71c5b2bd7a970cb2fb60" UNIQUE ("name"), CONSTRAINT "PK_81fb355f821a2e3fa37f77eb664" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "fio" character varying NOT NULL, "mail" character varying NOT NULL, "tel" character varying NOT NULL, "description" character varying NOT NULL, "region" character varying NOT NULL, "address" character varying NOT NULL, "price" integer NOT NULL, "deliveryTypeId" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_product" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "price" integer NOT NULL, "amount" integer NOT NULL, "productId" integer, "orderId" integer, CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_category" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_subcategory" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "productCategoryId" integer, CONSTRAINT "PK_0c9ba3f2d09244e06fc22ff618d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product" ADD "price" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product" ADD "productSubcategoryId" integer`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_79b002b0748069c808d48c9cd04" FOREIGN KEY ("deliveryTypeId") REFERENCES "delivery_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD CONSTRAINT "FK_073c85ed133e05241040bd70f02" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD CONSTRAINT "FK_3fb066240db56c9558a91139431" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_b097139355a54852dfc5ea7d1af" FOREIGN KEY ("productSubcategoryId") REFERENCES "product_subcategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_subcategory" ADD CONSTRAINT "FK_fdbcc346ebbcdc45c0eb90e821e" FOREIGN KEY ("productCategoryId") REFERENCES "product_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_subcategory" DROP CONSTRAINT "FK_fdbcc346ebbcdc45c0eb90e821e"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_b097139355a54852dfc5ea7d1af"`);
        await queryRunner.query(`ALTER TABLE "order_product" DROP CONSTRAINT "FK_3fb066240db56c9558a91139431"`);
        await queryRunner.query(`ALTER TABLE "order_product" DROP CONSTRAINT "FK_073c85ed133e05241040bd70f02"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_79b002b0748069c808d48c9cd04"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "productSubcategoryId"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "price"`);
        await queryRunner.query(`DROP TABLE "product_subcategory"`);
        await queryRunner.query(`DROP TABLE "product_category"`);
        await queryRunner.query(`DROP TABLE "order_product"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TABLE "delivery_type"`);
    }

}
