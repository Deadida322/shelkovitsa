import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordResetToken1792767111914 implements MigrationInterface {
	name = 'PasswordResetToken1792767111914';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "password_reset_token" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "userId" integer NOT NULL, CONSTRAINT "PK_password_reset_token_id" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_password_reset_token_hash" ON "password_reset_token" ("tokenHash")`
		);
		await queryRunner.query(
			`ALTER TABLE "password_reset_token" ADD CONSTRAINT "FK_password_reset_token_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "password_reset_token" DROP CONSTRAINT "FK_password_reset_token_user"`
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_token_hash"`);
		await queryRunner.query(`DROP TABLE "password_reset_token"`);
	}
}
