import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTel1792767111916 implements MigrationInterface {
	name = 'UserTel1792767111916';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// nullable: у уже созданных пользователей телефона не было
		await queryRunner.query(`ALTER TABLE "user" ADD "tel" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tel"`);
	}
}
