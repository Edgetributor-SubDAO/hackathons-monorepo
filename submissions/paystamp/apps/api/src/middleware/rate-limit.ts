import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import Redis from 'ioredis';

/**
 * Simple in-memory rate limiter (for development)
 * In production, use a proper Redis store or rate-limit-redis
 */
export function createRateLimiter(redis: Redis) {
  // For now, use default memory store
  // In production, implement proper Redis store or use rate-limit-redis package
  return rateLimit({

    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use IP address or user ID if authenticated
      const auth = (req as any).auth;
      if (auth?.userId) {
        return `rate-limit:user:${auth.userId}`;
      }
      if (auth?.address) {
        return `rate-limit:address:${auth.address}`;
      }
      return `rate-limit:ip:${req.ip}`;
    },
  });
}

/**
 * Create slow down middleware
 */
export function createSlowDown() {
  return slowDown({
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 50, // Start delaying after 50 requests
    delayMs: () => 500, // Add 500ms delay per request after delayAfter (v2 format)
    maxDelayMs: 2000, // Maximum delay of 2 seconds
    validate: {
      delayMs: false, // Disable validation warning
    },
  });
}

/**
 * GraphQL-specific rate limiter
 */
export function createGraphQLRateLimiter(redis: Redis) {
  // For now, use default memory store
  return rateLimit({

    windowMs: 60 * 1000,
    max: 200, // Higher limit for GraphQL
    keyGenerator: (req: Request) => {
      const auth = (req as any).auth;
      if (auth?.userId) {
        return `graphql:user:${auth.userId}`;
      }
      return `graphql:ip:${req.ip}`;
    },
  });
}

