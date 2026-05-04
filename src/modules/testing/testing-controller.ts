import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly dataSource: DataSource,
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
    const pgTables = ['device_sessions', 'likes', 'comments', 'posts', 'blogs', 'users'];
    for (const table of pgTables) {
      await this.dataSource
        .query(`DELETE FROM ${table};`)
        .catch(() => undefined);
    }
  }
}
