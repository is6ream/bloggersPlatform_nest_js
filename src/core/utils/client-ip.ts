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
  const forwardedFirst = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : xForwardedFor?.toString().split(',')[0]?.trim();

  // С trust proxy Express выставляет req.ip по цепочке доверенных прокси.
  // Сырой первый hop X-Forwarded-For клиент может подставить сам — тогда каждый
  // запрос получает «другой» IP и throttler никогда не даёт 429 через туннель.
  const raw =
    (req.ip != null && String(req.ip).length > 0 ? String(req.ip) : '') ||
    forwardedFirst ||
    req.socket?.remoteAddress ||
    'unknown';

  return normalizeClientIp(raw);
}
