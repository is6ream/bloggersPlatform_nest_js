process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.PGDATABASE = process.env.PGDATABASE || 'blogger_platform_test';
process.env.PGUSER = process.env.PGUSER || 'nestjs';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'nestjs';

/** Перед e2e: pnpm migration:run:test (схема в blogger_platform_test). См. test/e2e/README.md */

/** Длинный TTL для e2e: иначе refresh 20s даёт 401 на медленном CI между шагами сценария. */
process.env.JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || '15m';
process.env.JWT_ACCESS_EXPIRES_IN =
  process.env.JWT_ACCESS_EXPIRES_IN || '15m';
