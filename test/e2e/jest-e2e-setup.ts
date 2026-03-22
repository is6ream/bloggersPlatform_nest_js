import { join } from 'path';
import { tmpdir } from 'os';

/** Unique DB per Jest worker so parallel test files do not corrupt the same file. */
process.env.DEVICE_SESSIONS_SQLITE_PATH =
  process.env.DEVICE_SESSIONS_SQLITE_PATH ||
  join(tmpdir(), `jest-e2e-device-sessions-${process.pid}.sqlite`);
