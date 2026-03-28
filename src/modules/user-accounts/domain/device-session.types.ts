/** Plain row for device session persistence (PostgreSQL / API mapping). */
export interface DeviceSessionRow {
  deviceId: string;
  userId: string;
  ip: string;
  userAgent: string;
  refreshTokenHash: string;
  expiresAt: Date | null;
  lastActiveDate: Date;
  createdAt: Date;
}
