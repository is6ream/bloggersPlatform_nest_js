import Database from 'better-sqlite3';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { CoreConfig } from 'src/modules/app-module/core-config';

@Injectable()
export class DeviceSessionsSqliteDatabase
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DeviceSessionsSqliteDatabase.name);
  private db!: Database.Database;

  constructor(private readonly coreConfig: CoreConfig) {}

  onModuleInit(): void {
    const filePath = this.coreConfig.deviceSessionsSqlitePath;
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS device_sessions (
        device_id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT NOT NULL,
        refresh_token_hash TEXT NOT NULL,
        expires_at TEXT,
        last_active_date TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
    `);
  }

  onModuleDestroy(): void {
    try {
      this.db?.close();
    } catch (e) {
      this.logger.warn(`SQLite close: ${(e as Error).message}`);
    }
  }

  get database(): Database.Database {
    return this.db;
  }
}
