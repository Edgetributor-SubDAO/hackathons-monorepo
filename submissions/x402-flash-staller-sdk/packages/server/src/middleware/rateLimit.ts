import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = this.getIdentifier(req);
      const now = Date.now();

      if (!this.requests.has(identifier)) {
        this.requests.set(identifier, []);
      }

      const userRequests = this.requests.get(identifier)!;

      // Remove old requests outside window
      const validRequests = userRequests.filter(
        (timestamp) => now - timestamp < this.config.windowMs
      );

      if (validRequests.length >= this.config.maxRequests) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            retryAfter: Math.ceil(
              (validRequests[0] + this.config.windowMs - now) / 1000
            ),
          },
        });
      }

      validRequests.push(now);
      this.requests.set(identifier, validRequests);

      res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        (this.config.maxRequests - validRequests.length).toString()
      );

      next();
    };
  }

  private getIdentifier(req: Request): string {
    // Use IP address or user ID
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  }

  private cleanup() {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(
        (t) => now - t < this.config.windowMs
      );
      if (valid.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, valid);
      }
    }
  }
}
