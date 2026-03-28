-- Local PostgreSQL setup for blogger-platform (device_sessions, E2E).
-- Run once as superuser, e.g.:
--   psql -U postgres -h localhost -f scripts/postgres-local-init.sql
-- Matches defaults in src/modules/app-module/core-config.ts and test/e2e/jest-e2e-setup.ts.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nestjs') THEN
    CREATE ROLE nestjs WITH LOGIN PASSWORD 'nestjs';
  END IF;
END
$$;

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
