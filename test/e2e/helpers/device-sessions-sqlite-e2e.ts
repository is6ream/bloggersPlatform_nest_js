import { join } from 'path';
import { tmpdir } from 'os';

/** Must run before `Test.createTestingModule({ imports: [AppModule] })`. */
export function assignE2eDeviceSessionsDbPath(): string {
  const filePath = join(
    tmpdir(),
    `e2e-device-sessions-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`,
  );
  process.env.DEVICE_SESSIONS_SQLITE_PATH = filePath;
  return filePath;
}
