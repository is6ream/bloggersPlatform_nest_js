import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSessionOrmEntity } from './device-session.orm-entity';

@Injectable()
export class DeviceSessionsRepository {
  constructor(
    @InjectRepository(DeviceSessionOrmEntity)
    private readonly repo: Repository<DeviceSessionOrmEntity>,
  ) {}

  async createSession(params: {
    userId: string;
    deviceId: string;
    ip: string;
    userAgent: string;
    refreshTokenHash: string;
    expiresAt?: Date;
  }): Promise<void> {
    const entity = this.repo.create({
      deviceId: params.deviceId,
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      refreshTokenHash: params.refreshTokenHash,
      expiresAt: params.expiresAt ?? null,
    });
    await this.repo.save(entity);
  }

  /**
   * Atomically updates refreshTokenHash only if current hash matches.
   */
  async updateSessionTokenIfMatch(params: {
    userId: string;
    deviceId: string;
    currentRefreshTokenHash: string;
    newRefreshTokenHash: string;
  }): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(DeviceSessionOrmEntity)
      .set({
        refreshTokenHash: params.newRefreshTokenHash,
        lastActiveDate: () => 'NOW()',
      })
      .where(
        'user_id = :userId AND device_id = :deviceId AND refresh_token_hash = :currentHash',
        {
          userId: params.userId,
          deviceId: params.deviceId,
          currentHash: params.currentRefreshTokenHash,
        },
      )
      .execute();
    return result.affected === 1;
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

  async findByUserAndDevice(
    userId: string,
    deviceId: string,
  ): Promise<{ refreshTokenHash: string; ip: string | null } | null> {
    const session = await this.repo.findOne({
      where: { userId, deviceId },
      select: ['refreshTokenHash', 'ip'],
    });
    return session ?? null;
  }
}
