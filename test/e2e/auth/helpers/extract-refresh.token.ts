export function extractRefreshToken(
  cookie: string | string[] | undefined,
): string | null {
  if (!cookie) return null;

  const parts = Array.isArray(cookie) ? cookie : [cookie];
  for (const cookieStr of parts) {
    if (typeof cookieStr !== 'string') continue;
    const match = cookieStr.match(/refreshToken=([^;]+)/);
    if (match) return match[1].trim();
  }
  return null;
}
