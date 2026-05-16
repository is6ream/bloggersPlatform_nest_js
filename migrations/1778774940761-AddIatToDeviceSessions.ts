import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIatToDeviceSessions1778774940761 implements MigrationInterface {
    name = 'AddIatToDeviceSessions1778774940761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_sessions" DROP COLUMN "refresh_token_hash"`);
        await queryRunner.query(`ALTER TABLE "device_sessions" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "device_sessions" DROP COLUMN "last_active_date"`);
        await queryRunner.query(`ALTER TABLE "device_sessions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "device_sessions" ADD "iat" text NOT NULL`);
        }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_sessions" DROP COLUMN "iat"`);
        await queryRunner.query(`ALTER TABLE "device_sessions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "device_sessions" ADD "last_active_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "device_sessions" ADD "expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "device_sessions" ADD "refresh_token_hash" text NOT NULL`);
    }

}
