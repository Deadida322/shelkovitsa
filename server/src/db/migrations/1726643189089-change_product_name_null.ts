import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeProductNameNull1726643189089 implements MigrationInterface {
    name = 'ChangeProductNameNull1726643189089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "name" SET NOT NULL`);
    }

}
