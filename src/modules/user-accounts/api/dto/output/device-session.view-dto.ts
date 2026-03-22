import { DeviceSessionRow } from '../../../domain/device-session.types';

export class DeviceSessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(row: DeviceSessionRow): DeviceSessionViewDto {
    const view = new DeviceSessionViewDto();
    view.ip = row.ip;
    view.title = row.userAgent;
    view.lastActiveDate = row.lastActiveDate.toISOString();
    view.deviceId = row.deviceId;
    return view;
  }
}
