import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DeviceSession,
  DeviceSessionDocument,
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

  /**
   * Atomically updates refreshTokenHash only if current hash matches.
   * Matches by userId, deviceId and current hash so the same token cannot be used twice.
   * Uses native collection to ensure write is visible to subsequent reads (no Mongoose cache).
   * Returns true if document was updated, false if no document matched (token already rotated or session gone).
   */
  async updateSessionTokenIfMatch(params: {
    userId: string;
    deviceId: string;
    currentRefreshTokenHash: string;
    newRefreshTokenHash: string;
  }): Promise<boolean> {
    const result = await this.deviceSessionModel.collection.updateOne(
      {
        userId: params.userId,
        deviceId: params.deviceId,
        refreshTokenHash: params.currentRefreshTokenHash,
      },
      {
        $set: {
          refreshTokenHash: params.newRefreshTokenHash,
          lastActiveDate: new Date(),
        },
      },
    );
    return result.matchedCount === 1 && result.modifiedCount === 1;
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

  async findByUserAndDevice(
    userId: string,
    deviceId: string,
  ): Promise<{ _id: unknown; refreshTokenHash: string } | null> {
    const doc = await this.deviceSessionModel
      .findOne({ userId, deviceId }, { refreshTokenHash: 1 })
      .lean()
      .exec();
    return doc ? (doc as { _id: unknown; refreshTokenHash: string }) : null;
  }
}

