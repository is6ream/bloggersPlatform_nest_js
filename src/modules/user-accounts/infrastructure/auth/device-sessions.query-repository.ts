import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DeviceSession,
  DeviceSessionDocument,
  DeviceSessionModelType,
} from '../../domain/device-session.entity';

@Injectable()
export class DeviceSessionsQueryRepository {
  constructor(
    @InjectModel(DeviceSession.name)
    private readonly deviceSessionModel: DeviceSessionModelType,
  ) {}

  async findAllByUserId(userId: string): Promise<DeviceSessionDocument[]> {
    return this.deviceSessionModel.find({ userId }).exec();
  }
}
