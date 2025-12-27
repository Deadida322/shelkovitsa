import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTgAudit1766835033821 implements MigrationInterface {
    name = 'AddTgAudit1766835033821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."telegram_order_message_status_enum" AS ENUM('pending', 'sent', 'failed', 'retrying')`);
        await queryRunner.query(`CREATE TABLE "telegram_order_message" ("created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "is_deleted" boolean NOT NULL DEFAULT false, "id" SERIAL NOT NULL, "status" "public"."telegram_order_message_status_enum" NOT NULL DEFAULT 'pending', "telegramMessageId" integer, "errorMessage" text, "sentAt" TIMESTAMP, "retryCount" integer NOT NULL DEFAULT '0', "orderId" integer NOT NULL, CONSTRAINT "REL_4ede5261ba5a4a9c6964c0fae2" UNIQUE ("orderId"), CONSTRAINT "PK_55770955009f19931c94b9570bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "telegram_order_message" ADD CONSTRAINT "FK_4ede5261ba5a4a9c6964c0fae26" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram_order_message" DROP CONSTRAINT "FK_4ede5261ba5a4a9c6964c0fae26"`);
        await queryRunner.query(`DROP TABLE "telegram_order_message"`);
        await queryRunner.query(`DROP TYPE "public"."telegram_order_message_status_enum"`);
    }

}
