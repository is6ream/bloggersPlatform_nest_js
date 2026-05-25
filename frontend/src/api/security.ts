import { apiRequest } from './client';
import type { DeviceSession } from '../types/api';

export const securityApi = {
  getDevices() {
    return apiRequest<DeviceSession[]>('/security/devices');
  },

  deleteAllOther() {
    return apiRequest<void>('/security/devices', { method: 'DELETE' });
  },

  deleteDevice(deviceId: string) {
    return apiRequest<void>(`/security/devices/${deviceId}`, { method: 'DELETE' });
  },
};
