import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStartGameDateToQuizGames1780206000000 implements MigrationInterface {
  name = 'AddStartGameDateToQuizGames1780206000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      ADD "startGameDate" TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_games" DROP COLUMN "startGameDate"`);
  }
}
