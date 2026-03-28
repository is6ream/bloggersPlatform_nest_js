import { Pool } from 'pg';

function ensurePgEnv(): void {
  process.env.PGHOST = process.env.PGHOST || 'localhost';
  process.env.PGPORT = process.env.PGPORT || '5432';
  process.env.PGDATABASE = process.env.PGDATABASE || 'blogger_platform_test';
  process.env.PGUSER = process.env.PGUSER || 'postgres';
  process.env.PGPASSWORD = process.env.PGPASSWORD || 'postgres';
}

export function assignE2eDeviceSessionsPgConfig(): void {
  ensurePgEnv();
}

export async function clearE2eDeviceSessionsTable(): Promise<void> {
  ensurePgEnv();
  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });
  try {
    await pool.query('DELETE FROM device_sessions');
  } finally {
    await pool.end();
  }
}
