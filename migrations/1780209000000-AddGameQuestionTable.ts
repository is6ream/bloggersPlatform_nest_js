import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameQuestionTable1780209000000 implements MigrationInterface {
  name = 'AddGameQuestionTable1780209000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "game_question" (
        "gameQuestionId" SERIAL NOT NULL,
        "questionId" uuid NOT NULL,
        "gameId" uuid NOT NULL,
        "index" integer NOT NULL,
        CONSTRAINT "PK_game_question" PRIMARY KEY ("gameQuestionId"),
        CONSTRAINT "FK_game_question_game" FOREIGN KEY ("gameId") REFERENCES "quiz_games"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_game_question_question" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "game_question"`);
  }
}
