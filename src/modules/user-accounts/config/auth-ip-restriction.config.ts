import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { getClientIpFromRequest } from 'src/core/utils/client-ip';

/**
 * Единственное место управления IP restriction для всех эндпоинтов /auth.
 * false — rate limit по IP отключён; true — лимиты из AUTH_IP_RESTRICTION_LIMITS.
 */
export const AUTH_IP_RESTRICTION_ENABLED = true;

export const AUTH_IP_RESTRICTION_LIMITS = {
  default: { limit: 5, ttlMs: 10_000 },
  newPassword: { limit: 5, ttlMs: 60_000 },
} as const;

export const authNewPasswordThrottle = {
  default: {
    limit: AUTH_IP_RESTRICTION_LIMITS.newPassword.limit,
    ttl: AUTH_IP_RESTRICTION_LIMITS.newPassword.ttlMs,
  },
};

export const authIpRestrictionThrottlerOptions: ThrottlerModuleOptions = {
  throttlers: [
    {
      ttl: AUTH_IP_RESTRICTION_LIMITS.default.ttlMs,
      limit: AUTH_IP_RESTRICTION_LIMITS.default.limit,
    },
  ],
  getTracker: (req) => getClientIpFromRequest(req),
};
