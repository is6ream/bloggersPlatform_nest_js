import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQuizQuestionsSchema1780202000000
  implements MigrationInterface
{
  name = 'UpdateQuizQuestionsSchema1780202000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP COLUMN "answer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD "correctAnswers" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP COLUMN "correctAnswers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD "answer" character varying(255) NOT NULL DEFAULT ''`,
    );
  }
}
