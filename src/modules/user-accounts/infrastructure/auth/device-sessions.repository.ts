import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSessionOrmEntity } from './device-session.orm-entity';
import { DeviceSessionRow } from '../../domain/device-session.types';

@Injectable()
export class DeviceSessionsRepository {
  constructor(
    @InjectRepository(DeviceSessionOrmEntity)
    private readonly repo: Repository<DeviceSessionOrmEntity>,
  ) { }

  async createSession(params: {
    userId: string;
    deviceId: string;
    ip: string;
    userAgent: string;
    iat: Date
  }): Promise<void> {
    const entity = this.repo.create({
      deviceId: params.deviceId,
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
    });
    await this.repo.save(entity);
  }


  async deleteSession(userId: string, deviceId: string): Promise<void> {
    await this.repo.delete({ userId, deviceId });
  }

  async deleteAllSessionsExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId AND device_id != :deviceId', { userId, deviceId })
      .execute();
  }

  async findByUserDeviceAndIat(
    userId: string,
    deviceId: string,
    iat: number,
  ): Promise<DeviceSessionRow | null> {
    return this.repo.findOne({
      where: {
        userId,
        deviceId,
        iat: new Date(iat * 1000),
      },
    });
  }

}
