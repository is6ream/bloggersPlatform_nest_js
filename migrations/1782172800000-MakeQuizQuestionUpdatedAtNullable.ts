import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeQuizQuestionUpdatedAtNullable1782172800000
  implements MigrationInterface
{
  name = 'MakeQuizQuestionUpdatedAtNullable1782172800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ALTER COLUMN "updatedAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ALTER COLUMN "updatedAt" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "quiz_questions" SET "updatedAt" = now() WHERE "updatedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ALTER COLUMN "updatedAt" SET NOT NULL`,
    );
  }
}
