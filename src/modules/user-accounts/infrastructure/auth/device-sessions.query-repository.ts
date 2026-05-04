import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSessionRow } from '../../domain/device-session.types';
import { DeviceSessionOrmEntity } from './device-session.orm-entity';

@Injectable()
export class DeviceSessionsQueryRepository {
  constructor(
    @InjectRepository(DeviceSessionOrmEntity)
    private readonly repo: Repository<DeviceSessionOrmEntity>,
  ) {}

  async findAllByUserId(userId: string): Promise<DeviceSessionRow[]> {
    return this.repo.find({
      where: { userId },
      order: { lastActiveDate: 'DESC' },
    });
  }

  async findByDeviceId(deviceId: string): Promise<DeviceSessionRow | null> {
    return this.repo.findOne({ where: { deviceId } });
  }
}
