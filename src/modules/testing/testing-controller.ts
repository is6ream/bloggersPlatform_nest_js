import { Controller, Delete, HttpCode, HttpStatus, Inject } from '@nestjs/common';
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
    await this.dataSource.query(
      `TRUNCATE TABLE users, blogs, posts RESTART IDENTITY CASCADE;`,
    );
    await this.deviceSessionsDb.db.query(
      `TRUNCATE TABLE device_sessions RESTART IDENTITY CASCADE;`,
    );
  }
}
