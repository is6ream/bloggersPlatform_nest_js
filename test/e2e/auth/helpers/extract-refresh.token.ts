export function extractRefreshToken(cookie: string): string | null {
  const match = cookie.match(/refreshToken=([^;]+)/);
  return match ? match[1] : null;
}
