import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeIatToTimestamptz1778781600000 implements MigrationInterface {
  name = 'ChangeIatToTimestamptz1778781600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_sessions" ALTER COLUMN "iat" TYPE TIMESTAMP WITH TIME ZONE USING "iat"::timestamptz`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_sessions" ALTER COLUMN "iat" TYPE text USING "iat"::text`,
    );
  }
}
