import { Injectable } from '@nestjs/common';
import { DeviceSessionRow } from '../../domain/device-session.types';
import { DeviceSessionsSqliteDatabase } from './device-sessions-sqlite.database';

type DeviceSessionDbRow = {
  device_id: string;
  user_id: string;
  ip: string | null;
  user_agent: string;
  refresh_token_hash: string;
  expires_at: string | null;
  last_active_date: string;
  created_at: string;
};

function mapRow(r: DeviceSessionDbRow): DeviceSessionRow {
  return {
    deviceId: r.device_id,
    userId: r.user_id,
    ip: r.ip ?? '',
    userAgent: r.user_agent,
    refreshTokenHash: r.refresh_token_hash,
    expiresAt:
      r.expires_at != null && r.expires_at !== ''
        ? new Date(r.expires_at)
        : null,
    lastActiveDate: new Date(r.last_active_date),
    createdAt: new Date(r.created_at),
  };
}

@Injectable()
export class DeviceSessionsQueryRepository {
  constructor(private readonly sqlite: DeviceSessionsSqliteDatabase) {}

  async findAllByUserId(userId: string): Promise<DeviceSessionRow[]> {
    const rows = this.sqlite.database
      .prepare(
        `SELECT device_id, user_id, ip, user_agent, refresh_token_hash, expires_at, last_active_date, created_at
         FROM device_sessions WHERE user_id = ? ORDER BY last_active_date DESC`,
      )
      .all(userId) as DeviceSessionDbRow[];
    return rows.map(mapRow);
  }

  async findByDeviceId(deviceId: string): Promise<DeviceSessionRow | null> {
    const row = this.sqlite.database
      .prepare(
        `SELECT device_id, user_id, ip, user_agent, refresh_token_hash, expires_at, last_active_date, created_at
         FROM device_sessions WHERE device_id = ?`,
      )
      .get(deviceId) as DeviceSessionDbRow | undefined;
    return row ? mapRow(row) : null;
  }
}
