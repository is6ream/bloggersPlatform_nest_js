import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizAnswersTable1781802103884 implements MigrationInterface {
  name = 'AddQuizAnswersTable1781802103884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "quiz_answers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "questionId" uuid NOT NULL,
        "playerId" uuid NOT NULL,
        "answerDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" character varying NOT NULL,
        CONSTRAINT "PK_quiz_answers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_answers_question"
          FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_answers_player"
          FOREIGN KEY ("playerId") REFERENCES "quiz_players"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_answers" ("questionId", "playerId", "answerDate", "status")
      SELECT
        (answer->>'questionId')::uuid,
        player.id,
        (answer->>'addedAt')::timestamptz,
        answer->>'answerStatus'
      FROM "quiz_players" AS player
      CROSS JOIN LATERAL jsonb_array_elements(player.answers) AS answer
      WHERE jsonb_array_length(player.answers) > 0
    `);

    await queryRunner.query(`ALTER TABLE "quiz_players" DROP COLUMN "answers"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quiz_players"
      ADD "answers" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "quiz_players" AS player
      SET "answers" = COALESCE(answers_by_player.answers_json, '[]'::jsonb)
      FROM (
        SELECT
          answer."playerId",
          jsonb_agg(
            jsonb_build_object(
              'questionId', answer."questionId"::text,
              'answerStatus', answer.status,
              'addedAt', answer."answerDate"::text
            )
            ORDER BY answer."createdAt"
          ) AS answers_json
        FROM "quiz_answers" AS answer
        GROUP BY answer."playerId"
      ) AS answers_by_player
      WHERE player.id = answers_by_player."playerId"
    `);

    await queryRunner.query(`DROP TABLE "quiz_answers"`);
  }
}
