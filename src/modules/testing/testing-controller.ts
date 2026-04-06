import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { DeviceSessionsPostgresDatabase } from '../user-accounts/infrastructure/auth/device-sessions-postgres.database';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly dataSource: DataSource,
    private readonly deviceSessionsDb: DeviceSessionsPostgresDatabase,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(): Promise<void> {
    await Promise.all([
      this.clearMongo(),
      this.clearPostgres(),
    ]);
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
