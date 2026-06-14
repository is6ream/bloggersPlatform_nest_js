import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialPostgresTables1778774000000
  implements MigrationInterface
{
  name = 'CreateInitialPostgresTables1778774000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "login" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "passwordHash" text NOT NULL,
        "confirmationCode" text NOT NULL,
        "confirmationExpiration" TIMESTAMP WITH TIME ZONE NOT NULL,
        "isEmailConfirmed" boolean NOT NULL DEFAULT false,
        "recoveryCode" text,
        "recoveryExpiresAt" TIMESTAMP WITH TIME ZONE,
        "recoveryIsUsed" boolean,
        "deleteAt" TIMESTAMP WITH TIME ZONE,
        "refreshTokenHash" text,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "users_login_active_idx"
      ON "users" ("login")
      WHERE "deleteAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "users_email_active_idx"
      ON "users" ("email")
      WHERE "deleteAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "device_sessions" (
        "device_id" text NOT NULL,
        "user_id" text NOT NULL,
        "ip" text,
        "user_agent" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_active_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "refresh_token_hash" text NOT NULL,
        CONSTRAINT "PK_device_sessions" PRIMARY KEY ("device_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blogs" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(15) NOT NULL,
        "description" character varying(500) NOT NULL,
        "websiteUrl" character varying(100) NOT NULL,
        "isMembership" boolean NOT NULL DEFAULT false,
        "deleteAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_blogs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "title" character varying(30) NOT NULL,
        "shortDescription" character varying(100) NOT NULL,
        "content" character varying(1000) NOT NULL,
        "blogId" character varying NOT NULL,
        "blogName" character varying(15) NOT NULL,
        "deleteAt" TIMESTAMP WITH TIME ZONE,
        "likesCount" integer NOT NULL DEFAULT 0,
        "dislikesCount" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_posts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "content" character varying(300) NOT NULL,
        "commentatorUserId" character varying NOT NULL,
        "commentatorUserLogin" character varying(255) NOT NULL,
        "postId" character varying NOT NULL,
        "deleteAt" TIMESTAMP WITH TIME ZONE,
        "likesCount" integer NOT NULL DEFAULT 0,
        "dislikesCount" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_comments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "likes" (
        "id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status" character varying(10) NOT NULL,
        "userId" uuid NOT NULL,
        "parentId" uuid NOT NULL,
        "parentType" character varying(20) NOT NULL,
        CONSTRAINT "PK_likes" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "likes"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "blogs"`);
    await queryRunner.query(`DROP TABLE "device_sessions"`);
    await queryRunner.query(`DROP INDEX "users_email_active_idx"`);
    await queryRunner.query(`DROP INDEX "users_login_active_idx"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
