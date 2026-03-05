import { DeviceSessionDocument } from '../../../domain/device-session.entity';

export class DeviceSessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(doc: DeviceSessionDocument): DeviceSessionViewDto {
    const view = new DeviceSessionViewDto();
    view.ip = doc.ip;
    view.title = doc.userAgent;
    view.lastActiveDate = (doc as any).lastActiveAt?.toISOString() ?? new Date().toISOString();
    view.deviceId = doc.deviceId;
    return view;
  }
}
