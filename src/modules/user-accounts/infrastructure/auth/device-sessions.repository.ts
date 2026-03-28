import { Injectable } from '@nestjs/common';
import { DeviceSessionsPostgresDatabase } from './device-sessions-postgres.database';

@Injectable()
export class DeviceSessionsRepository {
  constructor(private readonly postgres: DeviceSessionsPostgresDatabase) {}

  async createSession(params: {
    userId: string;
    deviceId: string;
    ip: string;
    userAgent: string;
    refreshTokenHash: string;
    expiresAt?: Date;
  }): Promise<void> {
    const expiresAt =
      params.expiresAt != null ? params.expiresAt.toISOString() : null;
    await this.postgres.db.query(
      `INSERT INTO device_sessions (device_id, user_id, ip, user_agent, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.deviceId,
        params.userId,
        params.ip,
        params.userAgent,
        params.refreshTokenHash,
        expiresAt,
      ],
    );
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
    const result = await this.postgres.db.query(
      `UPDATE device_sessions
       SET refresh_token_hash = $1, last_active_date = NOW()
       WHERE user_id = $2 AND device_id = $3 AND refresh_token_hash = $4`,
      [
        params.newRefreshTokenHash,
        params.userId,
        params.deviceId,
        params.currentRefreshTokenHash,
      ],
    );
    return result.rowCount === 1;
  }

  async deleteSession(userId: string, deviceId: string): Promise<void> {
    await this.postgres.db.query(
      `DELETE FROM device_sessions WHERE user_id = $1 AND device_id = $2`,
      [userId, deviceId],
    );
  }

  async deleteAllSessionsExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.postgres.db.query(
      `DELETE FROM device_sessions WHERE user_id = $1 AND device_id != $2`,
      [userId, deviceId],
    );
  }

  async findByUserAndDevice(
    userId: string,
    deviceId: string,
  ): Promise<{ refreshTokenHash: string } | null> {
    const result = await this.postgres.db.query<{ refreshTokenHash: string }>(
      `SELECT refresh_token_hash AS "refreshTokenHash"
       FROM device_sessions
       WHERE user_id = $1 AND device_id = $2`,
      [userId, deviceId],
    );
    return result.rows[0] ?? null;
  }
}
