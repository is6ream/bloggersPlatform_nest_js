export function extractRefreshToken(
  cookie: string | string[] | undefined,
): string | null {
  if (!cookie) return null;

  const cookieStr = Array.isArray(cookie) ? cookie[0] : cookie;
  if (typeof cookieStr !== 'string') return null;

  const match = cookieStr.match(/refreshToken=([^;]+)/);
  return match ? match[1] : null;
}
