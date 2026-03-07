import { apiClient } from './client';
import type { DeviceSession } from './types';

export const securityApi = {
  getDevices: () =>
    apiClient.get<DeviceSession[]>('/security/devices'),

  deleteAllOtherSessions: () =>
    apiClient.delete('/security/devices'),

  deleteSession: (deviceId: string) =>
    apiClient.delete(`/security/devices/${deviceId}`),
};
