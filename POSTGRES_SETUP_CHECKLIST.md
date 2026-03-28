# PostgreSQL Setup Checklist (pgAdmin)

Этот чек-лист нужен для подготовки окружения под миграцию `blogs` с Mongo на PostgreSQL.

## 1) Проверить, что сервер PostgreSQL запущен

- В `pgAdmin` должен открываться ваш сервер (обычно `localhost:5432`).
- Если сервер недоступен, сначала поднимите службу PostgreSQL в Windows Services.

## 2) Проверить/создать роль `nestjs`

В `pgAdmin` откройте `Query Tool` (под суперпользователем, например `postgres`) и выполните:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nestjs') THEN
    CREATE ROLE nestjs WITH LOGIN PASSWORD 'nestjs';
  END IF;
END
$$;
```

Проверка:

```sql
SELECT rolname FROM pg_roles WHERE rolname = 'nestjs';
```

## 3) Проверить/создать базы

Выполните:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'blogger_platform') THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', 'blogger_platform', 'nestjs');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'blogger_platform_test') THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', 'blogger_platform_test', 'nestjs');
  END IF;
END
$$;
```

Проверка:

```sql
SELECT datname
FROM pg_database
WHERE datname IN ('blogger_platform', 'blogger_platform_test');
```

## 4) Выдать права (если нужно)

Откройте Query Tool отдельно для каждой базы:

- сначала для `blogger_platform`
- потом для `blogger_platform_test`

И выполните:

```sql
GRANT ALL PRIVILEGES ON DATABASE blogger_platform TO nestjs;
GRANT USAGE, CREATE ON SCHEMA public TO nestjs;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nestjs;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nestjs;
```

Для `blogger_platform_test` замените имя базы в первой строке:

```sql
GRANT ALL PRIVILEGES ON DATABASE blogger_platform_test TO nestjs;
GRANT USAGE, CREATE ON SCHEMA public TO nestjs;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nestjs;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nestjs;
```

## 5) Проверка подключения под `nestjs`

Подключитесь в `pgAdmin` к базе `blogger_platform_test` под пользователем `nestjs` и выполните:

```sql
SELECT current_user, current_database();
```

Ожидаемо:

- `current_user = nestjs`
- `current_database = blogger_platform_test`

## 6) Сверить с настройками проекта

Проект ожидает такие значения по умолчанию:

- `PGHOST=localhost`
- `PGPORT=5432`
- `PGDATABASE=blogger_platform` (для e2e обычно `blogger_platform_test`)
- `PGUSER=nestjs`
- `PGPASSWORD=nestjs`

Ссылки в проекте:

- `scripts/postgres-local-init.sql`
- `src/modules/app-module/core-config.ts`
- `test/e2e/jest-e2e-setup.ts`

## 7) Быстрый признак, что всё готово

- Логин `nestjs` проходит.
- Обе БД существуют.
- Запрос `SELECT current_user, current_database();` выполняется без ошибок.
