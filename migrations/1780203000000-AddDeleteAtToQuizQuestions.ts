import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteAtToQuizQuestions1780203000000
  implements MigrationInterface
{
  name = 'AddDeleteAtToQuizQuestions1780203000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD "deleteAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP COLUMN "deleteAt"`,
    );
  }
}
