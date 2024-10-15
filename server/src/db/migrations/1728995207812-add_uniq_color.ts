import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqColor1728995207812 implements MigrationInterface {
    name = 'AddUniqColor1728995207812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_color" ADD CONSTRAINT "UQ_51915fefa90b7bca52573bc2353" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_color" DROP CONSTRAINT "UQ_51915fefa90b7bca52573bc2353"`);
    }

}
