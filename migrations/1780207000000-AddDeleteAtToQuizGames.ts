import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteAtToQuizGames1780207000000 implements MigrationInterface {
  name = 'AddDeleteAtToQuizGames1780207000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_games" ADD "deleteAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_games" DROP COLUMN "deleteAt"`);
  }
}
