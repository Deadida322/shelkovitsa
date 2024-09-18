import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1726665122063 implements MigrationInterface {
    name = 'Init1726665122063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_size" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_3210db31599e5c505183be05896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_color" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_e586d22a197c9b985af3ac82ce3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_category" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_subcategory" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "productCategoryId" integer, CONSTRAINT "PK_0c9ba3f2d09244e06fc22ff618d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_article" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying, "description" character varying, "logo" character varying, "article" character varying NOT NULL, "productSubcategoryId" integer, CONSTRAINT "UQ_ca77e6edcf6aa36792a69e69b8f" UNIQUE ("article"), CONSTRAINT "PK_47a9fc181d48431d856e1db3a0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_file" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "image" character varying NOT NULL, "productId" integer, CONSTRAINT "PK_16c46f3319e6d4117fb4994b91f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "amount" integer NOT NULL DEFAULT '0', "price" numeric NOT NULL, "productArticleId" integer, "productSizeId" integer, "productColorId" integer, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_product" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "price" integer NOT NULL, "amount" integer NOT NULL, "productId" integer, "orderId" integer, CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "delivery_type" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_d106c8e71c5b2bd7a970cb2fb60" UNIQUE ("name"), CONSTRAINT "PK_81fb355f821a2e3fa37f77eb664" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('create', 'payment', 'close')`);
        await queryRunner.query(`CREATE TABLE "order" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "fio" character varying NOT NULL, "mail" character varying NOT NULL, "tel" character varying NOT NULL, "description" character varying NOT NULL, "region" character varying NOT NULL, "address" character varying NOT NULL, "price" integer NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'create', "deliveryTypeId" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "fio" character varying NOT NULL, "mail" character varying NOT NULL, "password" character varying NOT NULL, "ordersId" integer, CONSTRAINT "UQ_7395ecde6cda2e7fe90253ec59f" UNIQUE ("mail"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "benefit" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "logo" character varying, CONSTRAINT "UQ_451e7b9e844f208c6183c239a5d" UNIQUE ("name"), CONSTRAINT "PK_c024dccb30e6f4702adffe884d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_subcategory" ADD CONSTRAINT "FK_fdbcc346ebbcdc45c0eb90e821e" FOREIGN KEY ("productCategoryId") REFERENCES "product_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_article" ADD CONSTRAINT "FK_58c4bbc1160f91291e71ddd26aa" FOREIGN KEY ("productSubcategoryId") REFERENCES "product_subcategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_file" ADD CONSTRAINT "FK_8908c9d576061144b562635769f" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_9ff8a251595fc3c3f674f332deb" FOREIGN KEY ("productArticleId") REFERENCES "product_article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_030571059646cb143abbe798809" FOREIGN KEY ("productSizeId") REFERENCES "product_size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_0f52162ea8f6690697b2d571709" FOREIGN KEY ("productColorId") REFERENCES "product_color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD CONSTRAINT "FK_073c85ed133e05241040bd70f02" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD CONSTRAINT "FK_3fb066240db56c9558a91139431" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_79b002b0748069c808d48c9cd04" FOREIGN KEY ("deliveryTypeId") REFERENCES "delivery_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_95a35edcd3803de3a0c851ab3e7" FOREIGN KEY ("ordersId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_95a35edcd3803de3a0c851ab3e7"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_79b002b0748069c808d48c9cd04"`);
        await queryRunner.query(`ALTER TABLE "order_product" DROP CONSTRAINT "FK_3fb066240db56c9558a91139431"`);
        await queryRunner.query(`ALTER TABLE "order_product" DROP CONSTRAINT "FK_073c85ed133e05241040bd70f02"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_0f52162ea8f6690697b2d571709"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_030571059646cb143abbe798809"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_9ff8a251595fc3c3f674f332deb"`);
        await queryRunner.query(`ALTER TABLE "product_file" DROP CONSTRAINT "FK_8908c9d576061144b562635769f"`);
        await queryRunner.query(`ALTER TABLE "product_article" DROP CONSTRAINT "FK_58c4bbc1160f91291e71ddd26aa"`);
        await queryRunner.query(`ALTER TABLE "product_subcategory" DROP CONSTRAINT "FK_fdbcc346ebbcdc45c0eb90e821e"`);
        await queryRunner.query(`DROP TABLE "benefit"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP TABLE "delivery_type"`);
        await queryRunner.query(`DROP TABLE "order_product"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "product_file"`);
        await queryRunner.query(`DROP TABLE "product_article"`);
        await queryRunner.query(`DROP TABLE "product_subcategory"`);
        await queryRunner.query(`DROP TABLE "product_category"`);
        await queryRunner.query(`DROP TABLE "product_color"`);
        await queryRunner.query(`DROP TABLE "product_size"`);
    }

}
