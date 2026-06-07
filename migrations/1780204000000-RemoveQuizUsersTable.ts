import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveQuizUsersTable1780204000000 implements MigrationInterface {
  name = 'RemoveQuizUsersTable1780204000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_players" DROP CONSTRAINT "FK_quiz_players_user"`,
    );

    await queryRunner.query(`
      DELETE FROM "quiz_players"
      WHERE "userId"::text NOT IN (SELECT "id" FROM "users")
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_players"
      ALTER COLUMN "userId" TYPE text USING "userId"::text
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_players"
      ADD CONSTRAINT "FK_quiz_players_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`DROP TABLE "quiz_users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "quiz_users" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_users" ("id", "createdAt")
      SELECT DISTINCT u."id"::uuid, u."createdAt"
      FROM "users" u
      INNER JOIN "quiz_players" p ON p."userId" = u."id"
    `);

    await queryRunner.query(
      `ALTER TABLE "quiz_players" DROP CONSTRAINT "FK_quiz_players_user"`,
    );

    await queryRunner.query(`
      ALTER TABLE "quiz_players"
      ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_players"
      ADD CONSTRAINT "FK_quiz_players_user"
      FOREIGN KEY ("userId") REFERENCES "quiz_users"("id") ON DELETE CASCADE
    `);
  }
}
