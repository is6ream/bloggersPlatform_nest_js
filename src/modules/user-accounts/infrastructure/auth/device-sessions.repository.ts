import { Injectable } from '@nestjs/common';
import { DeviceSessionsSqliteDatabase } from './device-sessions-sqlite.database';

@Injectable()
export class DeviceSessionsRepository {
  constructor(private readonly sqlite: DeviceSessionsSqliteDatabase) {}

  async createSession(params: {
    userId: string;
    deviceId: string;
    ip: string;
    userAgent: string;
    refreshTokenHash: string;
    expiresAt?: Date;
  }): Promise<void> {
    const db = this.sqlite.database;
    const expiresAt =
      params.expiresAt != null ? params.expiresAt.toISOString() : null;
    db.prepare(
      `INSERT INTO device_sessions (device_id, user_id, ip, user_agent, refresh_token_hash, expires_at)
       VALUES (@deviceId, @userId, @ip, @userAgent, @refreshTokenHash, @expiresAt)`,
    ).run({
      deviceId: params.deviceId,
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      refreshTokenHash: params.refreshTokenHash,
      expiresAt,
    });
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
    const result = this.sqlite.database
      .prepare(
        `UPDATE device_sessions
         SET refresh_token_hash = @newHash, last_active_date = datetime('now')
         WHERE user_id = @userId AND device_id = @deviceId AND refresh_token_hash = @currentHash`,
      )
      .run({
        newHash: params.newRefreshTokenHash,
        userId: params.userId,
        deviceId: params.deviceId,
        currentHash: params.currentRefreshTokenHash,
      });
    return result.changes === 1;
  }

  async deleteSession(userId: string, deviceId: string): Promise<void> {
    this.sqlite.database
      .prepare(
        `DELETE FROM device_sessions WHERE user_id = ? AND device_id = ?`,
      )
      .run(userId, deviceId);
  }

  async deleteAllSessionsExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    this.sqlite.database
      .prepare(
        `DELETE FROM device_sessions WHERE user_id = ? AND device_id != ?`,
      )
      .run(userId, deviceId);
  }

  async findByUserAndDevice(
    userId: string,
    deviceId: string,
  ): Promise<{ refreshTokenHash: string } | null> {
    const row = this.sqlite.database
      .prepare(
        `SELECT refresh_token_hash AS refreshTokenHash FROM device_sessions WHERE user_id = ? AND device_id = ?`,
      )
      .get(userId, deviceId) as { refreshTokenHash: string } | undefined;
    return row ?? null;
  }
}
