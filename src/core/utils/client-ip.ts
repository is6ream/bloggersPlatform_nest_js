/**
 * Единая нормализация IP для rate-limit, сессий и логов.
 * Без этого ::ffff:127.0.0.1 и 127.0.0.1 попадают в разные bucket'ы Throttler.
 */
export function normalizeClientIp(rawIp: string): string {
  const ipWithoutPort =
    rawIp.includes(':') && rawIp.includes('.')
      ? rawIp.replace(/^::ffff:/, '')
      : rawIp;

  if (ipWithoutPort === '::1') {
    return '127.0.0.1';
  }

  return ipWithoutPort.trim().toLowerCase();
}

export function getClientIpFromRequest(req: Record<string, any>): string {
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  const forwardedIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : xForwardedFor?.toString().split(',')[0]?.trim();

  const ip =
    forwardedIp ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';

  return normalizeClientIp(ip);
}
