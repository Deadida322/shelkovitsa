import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLog1792767111917 implements MigrationInterface {
	name = 'AuditLog1792767111917';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "audit_log" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"actorId" integer,
				"actorMail" character varying,
				"action" character varying(64) NOT NULL,
				"entity" character varying(64) NOT NULL,
				"entityId" character varying(64),
				"meta" jsonb,
				CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("created_at")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_audit_log_actor_id" ON "audit_log" ("actorId")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_audit_log_action" ON "audit_log" ("action")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_audit_log_entity" ON "audit_log" ("entity")`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_entity"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_action"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_actor_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_created_at"`);
		await queryRunner.query(`DROP TABLE "audit_log"`);
	}
}
