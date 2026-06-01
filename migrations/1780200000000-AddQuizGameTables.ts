import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizGameTables1780200000000 implements MigrationInterface {
  name = 'AddQuizGameTables1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "quiz_users" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "quiz_games" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status" character varying NOT NULL,
        CONSTRAINT "PK_quiz_games" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "quiz_questions" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "body" text NOT NULL,
        "answer" character varying(255) NOT NULL,
        "published" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_quiz_questions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "quiz_players" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "gameId" uuid NOT NULL,
        CONSTRAINT "PK_quiz_players" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_players_user" FOREIGN KEY ("userId") REFERENCES "quiz_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_players_game" FOREIGN KEY ("gameId") REFERENCES "quiz_games"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "quiz_players"`);
    await queryRunner.query(`DROP TABLE "quiz_questions"`);
    await queryRunner.query(`DROP TABLE "quiz_games"`);
    await queryRunner.query(`DROP TABLE "quiz_users"`);
  }
}
