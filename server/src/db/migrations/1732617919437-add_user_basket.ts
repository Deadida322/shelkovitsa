import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBasket1732617919437 implements MigrationInterface {
    name = 'AddUserBasket1732617919437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "basket" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "basket"`);
    }

}
