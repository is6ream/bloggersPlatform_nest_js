import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoreAndAnswersToQuizPlayers1780201000000
  implements MigrationInterface
{
  name = 'AddScoreAndAnswersToQuizPlayers1780201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_players" ADD "score" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_players" ADD "answers" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_players" DROP COLUMN "answers"`);
    await queryRunner.query(`ALTER TABLE "quiz_players" DROP COLUMN "score"`);
  }
}
