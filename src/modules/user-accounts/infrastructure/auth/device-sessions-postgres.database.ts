import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CoreConfig } from 'src/modules/app-module/core-config';

@Injectable()
export class DeviceSessionsPostgresDatabase
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DeviceSessionsPostgresDatabase.name);
  private pool!: Pool;

  constructor(private readonly coreConfig: CoreConfig) {}


  async onModuleInit(): Promise<void> {
    this.pool = new Pool(this.coreConfig.deviceSessionsPostgresConfig);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS device_sessions (
        device_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT NOT NULL,
        refresh_token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ,
        last_active_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id
      ON device_sessions(user_id);
    `);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.pool?.end();
    } catch (e) {
      this.logger.warn(`Postgres close: ${(e as Error).message}`);
    }
  }

  get db(): Pool {
    return this.pool;
  }
}
