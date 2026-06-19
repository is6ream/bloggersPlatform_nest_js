# E2E-тесты

## PostgreSQL (тестовая БД)

E2e используют PostgreSQL-базу **`blogger_platform_test`** (см. `test/e2e/jest-e2e-setup.ts`).

Перед первым запуском тестов:

1. Создать роль и базы (один раз):

   ```bash
   psql -U postgres -h localhost -f scripts/postgres-local-init.sql
   ```

2. Накатить миграции на тестовую БД:

   ```bash
   pnpm migration:run:test
   ```

   Команда подключается с `NODE_ENV=test` к `blogger_platform_test` (см. `typeorm.config.ts`).

Если базу пересоздали (`DROP DATABASE`), повторите шаг 2.

## Quiz Game — конкурентность

Скрипт:

```bash
pnpm test:e2e:quiz-game
```

Файл: `test/e2e/quizGame/connect-to-pair-concurrency.e2e-spec.ts`

Проверяет: при одновременном подключении двух игроков к одной pending-игре в ней остаётся ровно 2 игрока.

**Статус:** миграции накатаны на `blogger_platform_test`, тест на конкурентность проходит (`PASS`).
