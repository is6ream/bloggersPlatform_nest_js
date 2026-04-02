import { Controller, Delete, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { DeviceSessionsPostgresDatabase } from '../user-accounts/infrastructure/auth/device-sessions-postgres.database';
import { ThrottlerStorage } from '@nestjs/throttler';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly dataSource: DataSource,
    private readonly deviceSessionsDb: DeviceSessionsPostgresDatabase,
    @Inject(ThrottlerStorage) private readonly throttlerStorage: ThrottlerStorage,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(): Promise<void> {
    this.resetThrottler();
    await Promise.all([
      this.clearMongo(),
      this.clearPostgres(),
    ]);
  }

  private resetThrottler(): void {
    const s = this.throttlerStorage as any;
    if (s._storage instanceof Map) {
      s._storage.clear();  
    }
    if (s.timeoutIds instanceof Map) {
      s.timeoutIds.forEach((timeouts: ReturnType<typeof setTimeout>[]) =>
        timeouts.forEach(clearTimeout),
      );
      s.timeoutIds = new Map();
    }
  }

  private async clearMongo(): Promise<void> {
    const collections = await this.mongoConnection.listCollections();
    await Promise.all(
      collections.map((col) =>
        this.mongoConnection.collection(col.name).deleteMany({}),
      ),
    );
  }

  private async clearPostgres(): Promise<void> {
    const pgTables = ['likes', 'comments', 'posts', 'blogs', 'users'];
    for (const table of pgTables) {
      await this.dataSource
        .query(`DELETE FROM ${table};`)
        .catch(() => undefined);
    }
    await this.deviceSessionsDb.db
      .query(`DELETE FROM device_sessions;`)
      .catch(() => undefined);
  }
}
