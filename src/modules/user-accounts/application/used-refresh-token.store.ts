import { Injectable } from '@nestjs/common';

/**
 * In-memory store of refresh tokens that were already used (rotation).
 * Ensures the same token cannot be used twice even if DB read is delayed.
 */
@Injectable()
export class UsedRefreshTokenStore {
  private readonly used = new Set<string>();

  add(token: string): void {
    this.used.add(token);
  }

  isUsed(token: string): boolean {
    return this.used.has(token);
  }
}
