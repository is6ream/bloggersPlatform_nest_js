/** Plain row for device session persistence (PostgreSQL / API mapping). */
export interface DeviceSessionRow {
  deviceId: string;
  userId: string;
  ip: string | null;
  userAgent: string;
  iat: Date;
}
