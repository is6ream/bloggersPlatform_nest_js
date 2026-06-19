import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorQuizGamesPlayerRefs1780210000000 implements MigrationInterface {
  name = 'RefactorQuizGamesPlayerRefs1780210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      RENAME COLUMN "status" TO "gameStatus"
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      ADD "firstPlayerId" uuid,
      ADD "secondPlayerId" uuid,
      ADD "pairCreatedDate" character varying NOT NULL DEFAULT '',
      ADD "finishGameDate" character varying
    `);

    await queryRunner.query(`
      UPDATE "quiz_games"
      SET "pairCreatedDate" = "createdAt"::text
      WHERE "pairCreatedDate" = ''
    `);

    await queryRunner.query(`
      WITH ranked_players AS (
        SELECT
          id,
          "gameId",
          ROW_NUMBER() OVER (
            PARTITION BY "gameId"
            ORDER BY "createdAt"
          ) AS player_rank
        FROM "quiz_players"
      )
      UPDATE "quiz_games" AS game
      SET
        "firstPlayerId" = first_player.id,
        "secondPlayerId" = second_player.id
      FROM ranked_players AS first_player
      LEFT JOIN ranked_players AS second_player
        ON second_player."gameId" = first_player."gameId"
        AND second_player.player_rank = 2
      WHERE first_player."gameId" = game.id
        AND first_player.player_rank = 1
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      ADD CONSTRAINT "FK_quiz_games_first_player"
      FOREIGN KEY ("firstPlayerId") REFERENCES "quiz_players"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      ADD CONSTRAINT "FK_quiz_games_second_player"
      FOREIGN KEY ("secondPlayerId") REFERENCES "quiz_players"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      INSERT INTO "game_question" ("questionId", "gameId", "index")
      SELECT
        question_id::uuid,
        game.id,
        question_index - 1
      FROM "quiz_games" AS game
      CROSS JOIN LATERAL jsonb_array_elements_text(game."questionIds")
        WITH ORDINALITY AS questions(question_id, question_index)
      WHERE jsonb_array_length(game."questionIds") > 0
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games" DROP COLUMN "questionIds"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      ADD "questionIds" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "quiz_games" AS game
      SET "questionIds" = COALESCE(
        (
          SELECT jsonb_agg("questionId" ORDER BY "index")
          FROM "game_question"
          WHERE "gameId" = game.id
        ),
        '[]'::jsonb
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games" DROP CONSTRAINT "FK_quiz_games_second_player"
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games" DROP CONSTRAINT "FK_quiz_games_first_player"
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      DROP COLUMN "finishGameDate",
      DROP COLUMN "pairCreatedDate",
      DROP COLUMN "secondPlayerId",
      DROP COLUMN "firstPlayerId"
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_games"
      RENAME COLUMN "gameStatus" TO "status"
    `);
  }
}
