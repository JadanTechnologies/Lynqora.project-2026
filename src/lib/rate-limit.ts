interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.store = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1, resetIn: this.windowMs };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count, resetIn: entry.resetAt - now };
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// Predefined limiters
export const rateLimiters = {
  login: new RateLimiter(60000, 10),        // 10 per minute
  register: new RateLimiter(60000, 5),       // 5 per minute
  verificationCreate: new RateLimiter(60000, 10), // 10 per minute
  verificationRerun: new RateLimiter(3600000, 10), // 10 per hour
  publicLookup: new RateLimiter(60000, 30),  // 30 per minute
};

// Cleanup every 5 minutes
setInterval(() => {
  Object.values(rateLimiters).forEach((l) => l.cleanup());
}, 5 * 60 * 1000);

export function getRateLimitKey(ip: string, userId?: string): string {
  return userId ? `user:${userId}` : `ip:${ip}`;
}