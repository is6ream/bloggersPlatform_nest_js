import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionIdsToQuizGames1780205000000 implements MigrationInterface {
  name = 'AddQuestionIdsToQuizGames1780205000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      ADD "questionIds" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_games" DROP COLUMN "questionIds"`);
  }
}
