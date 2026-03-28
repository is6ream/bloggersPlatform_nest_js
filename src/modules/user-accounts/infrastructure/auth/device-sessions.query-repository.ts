import { Injectable } from '@nestjs/common';
import { DeviceSessionRow } from '../../domain/device-session.types';
import { DeviceSessionsPostgresDatabase } from './device-sessions-postgres.database';

type DeviceSessionDbRow = {
  deviceId: string;
  userId: string;
  ip: string | null;
  userAgent: string;
  refreshTokenHash: string;
  expiresAt: Date | null;
  lastActiveDate: Date;
  createdAt: Date;
};

function mapRow(r: DeviceSessionDbRow): DeviceSessionRow {
  return {
    deviceId: r.deviceId,
    userId: r.userId,
    ip: r.ip ?? '',
    userAgent: r.userAgent,
    refreshTokenHash: r.refreshTokenHash,
    expiresAt: r.expiresAt,
    lastActiveDate: r.lastActiveDate,
    createdAt: r.createdAt,
  };
}

@Injectable()
export class DeviceSessionsQueryRepository {
  constructor(private readonly postgres: DeviceSessionsPostgresDatabase) {}

  async findAllByUserId(userId: string): Promise<DeviceSessionRow[]> {
    const result = await this.postgres.db.query<DeviceSessionDbRow>(
      `SELECT
         device_id AS "deviceId",
         user_id AS "userId",
         ip,
         user_agent AS "userAgent",
         refresh_token_hash AS "refreshTokenHash",
         expires_at AS "expiresAt",
         last_active_date AS "lastActiveDate",
         created_at AS "createdAt"
       FROM device_sessions
       WHERE user_id = $1
       ORDER BY last_active_date DESC`,
      [userId],
    );
    return result.rows.map(mapRow);
  }

  async findByDeviceId(deviceId: string): Promise<DeviceSessionRow | null> {
    const result = await this.postgres.db.query<DeviceSessionDbRow>(
      `SELECT
         device_id AS "deviceId",
         user_id AS "userId",
         ip,
         user_agent AS "userAgent",
         refresh_token_hash AS "refreshTokenHash",
         expires_at AS "expiresAt",
         last_active_date AS "lastActiveDate",
         created_at AS "createdAt"
       FROM device_sessions
       WHERE device_id = $1`,
      [deviceId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }
}
