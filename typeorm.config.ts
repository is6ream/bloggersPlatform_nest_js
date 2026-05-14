import 'reflect-metadata';

import { existsSync } from 'fs';
import { join } from 'path';

import { config } from 'dotenv';
import { register } from 'tsconfig-paths';
import { DataSource } from 'typeorm';

register({
  baseUrl: '.',
  paths: { 'src/*': ['src/*'] },
});

const env = process.env.NODE_ENV || 'development';
const projectRoot = process.cwd();

const envFilePaths = [
  process.env.ENV_FILE_PATH?.trim() || '',
  join(projectRoot, 'src', 'env', `.env.${env}.local`),
  join(projectRoot, 'src', 'env', `.env.${env}`),
  join(projectRoot, 'src', 'env', '.env.production'),
  join(projectRoot, 'dist', 'env', `.env.${env}.local`),
  join(projectRoot, 'dist', 'env', `.env.${env}`),
  join(projectRoot, 'dist', 'env', '.env.production'),
].filter(Boolean);

for (const envFilePath of envFilePaths) {
  if (existsSync(envFilePath)) {
    config({ path: envFilePath, override: true });
  }
}

const pgHost = process.env.PGHOST?.trim() || 'localhost';
const pgPort = Number(process.env.PGPORT || '5432');
const pgDatabase = process.env.PGDATABASE?.trim() || 'blogger_platform';
const pgUser = process.env.PGUSER?.trim() || 'nodejs';
const pgPassword = process.env.PGPASSWORD?.trim() || 'nodejs';

export default new DataSource({
  type: 'postgres',
  host: pgHost,
  port: pgPort,
  username: pgUser,
  password: pgPassword,
  database: pgDatabase,
  migrations: ['migrations/*.ts'],
  entities: ['src/**/*.orm-entity.ts'],
  ssl:
    env === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
