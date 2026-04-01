import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

function createPool(): Pool {
  return new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'blogger_platform_test',
    user: process.env.PGUSER || 'nestjs',
    password: process.env.PGPASSWORD || 'nestjs',
  });
}

let usersTableEnsured = false;

export async function ensureE2eUsersTable(): Promise<void> {
  if (usersTableEnsured) {
    return;
  }
  const pool = createPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        login VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "confirmationCode" TEXT NOT NULL,
        "confirmationExpiration" TIMESTAMPTZ NOT NULL,
        "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
        "recoveryCode" TEXT NULL,
        "recoveryExpiresAt" TIMESTAMPTZ NULL,
        "recoveryIsUsed" BOOLEAN NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleteAt" TIMESTAMPTZ NULL,
        "refreshTokenHash" TEXT NULL
      );
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_login_active_idx
      ON users (login) WHERE "deleteAt" IS NULL;
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_idx
      ON users (email) WHERE "deleteAt" IS NULL;
    `);
    usersTableEnsured = true;
  } finally {
    await pool.end();
  }
}

export async function deleteAllE2eUsers(): Promise<void> {
  await ensureE2eUsersTable();
  const pool = createPool();
  try {
    await pool.query('DELETE FROM users');
  } finally {
    await pool.end();
  }
}

export type InsertE2eUserParams = {
  login: string;
  email: string;
  passwordPlain: string;
  isEmailConfirmed?: boolean;
};

export async function insertE2eUser(
  params: InsertE2eUserParams,
): Promise<{ id: string; login: string; email: string }> {
  await ensureE2eUsersTable();
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(params.passwordPlain, 10);
  const confirmationCode = randomUUID();
  const confirmationExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const isEmailConfirmed = params.isEmailConfirmed ?? true;

  const pool = createPool();
  try {
    await pool.query(
      `
      INSERT INTO users (
        id, login, email, "passwordHash",
        "confirmationCode", "confirmationExpiration", "isEmailConfirmed",
        "recoveryCode", "recoveryExpiresAt", "recoveryIsUsed",
        "createdAt", "deleteAt", "refreshTokenHash"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL, NOW(), NULL, NULL);
      `,
      [
        id,
        params.login,
        params.email,
        passwordHash,
        confirmationCode,
        confirmationExpiration,
        isEmailConfirmed,
      ],
    );
  } finally {
    await pool.end();
  }

  return { id, login: params.login, email: params.email };
}

export async function findE2eUserIdByLogin(
  login: string,
): Promise<string | null> {
  await ensureE2eUsersTable();
  const pool = createPool();
  try {
    const res = await pool.query(
      `SELECT id FROM users WHERE login = $1 AND "deleteAt" IS NULL LIMIT 1`,
      [login],
    );
    return res.rows[0]?.id ?? null;
  } finally {
    await pool.end();
  }
}

export async function findE2eUserConfirmationCode(
  email: string,
): Promise<string | null> {
  await ensureE2eUsersTable();
  const pool = createPool();
  try {
    const res = await pool.query(
      `SELECT "confirmationCode" FROM users WHERE email = $1 AND "deleteAt" IS NULL LIMIT 1`,
      [email],
    );
    return res.rows[0]?.confirmationCode ?? null;
  } finally {
    await pool.end();
  }
}

export async function findE2eUserRecoveryCode(
  email: string,
): Promise<string | null> {
  await ensureE2eUsersTable();
  const pool = createPool();
  try {
    const res = await pool.query(
      `SELECT "recoveryCode" FROM users WHERE email = $1 AND "deleteAt" IS NULL LIMIT 1`,
      [email],
    );
    return res.rows[0]?.recoveryCode ?? null;
  } finally {
    await pool.end();
  }
}
