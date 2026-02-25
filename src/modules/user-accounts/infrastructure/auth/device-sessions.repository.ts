import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DeviceSession,
  DeviceSessionModelType,
} from '../../domain/device-session.entity';

@Injectable()
export class DeviceSessionsRepository {
  constructor(
    @InjectModel(DeviceSession.name)
    private readonly deviceSessionModel: DeviceSessionModelType,
  ) {}

  async createSession(params: {
    userId: string;
    deviceId: string;
    ip: string;
    userAgent: string;
    refreshTokenHash: string;
    expiresAt?: Date;
  }) {
    const session = new this.deviceSessionModel({
      userId: params.userId,
      deviceId: params.deviceId,
      ip: params.ip,
      userAgent: params.userAgent,
      refreshTokenHash: params.refreshTokenHash,
      expiresAt: params.expiresAt,
    });

    await session.save();
    return session;
  }

  async updateSessionToken(params: {
    userId: string;
    deviceId: string;
    refreshTokenHash: string;
    expiresAt?: Date;
  }): Promise<void> {
    await this.deviceSessionModel.updateOne(
      { userId: params.userId, deviceId: params.deviceId },
      {
        refreshTokenHash: params.refreshTokenHash,
        expiresAt: params.expiresAt,
      },
    );
  }

  async deleteSession(userId: string, deviceId: string): Promise<void> {
    await this.deviceSessionModel.deleteOne({ userId, deviceId });
  }

  async deleteAllSessionsExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.deviceSessionModel.deleteMany({
      userId,
      deviceId: { $ne: deviceId },
    });
  }
}

