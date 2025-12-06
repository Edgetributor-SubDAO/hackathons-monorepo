/**
 * Application constants
 */

export const CACHE_TTL = {
  ACCESS_STATUS: 30, // seconds
  SERVICE_INFO: 300, // 5 minutes
  USER_STAMPS: 60, // 1 minute
} as const;

export const RATE_LIMITS = {
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
  },
  GRAPHQL: {
    windowMs: 60 * 1000, // 1 minute
    max: 200,
  },
  SLOW_DOWN: {
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 50,
    delayMs: 500,
  },
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const PAYMENT = {
  DEFAULT_CURRENCY: 'XLM',
  SUPPORTED_CURRENCIES: ['XLM', 'USDC'] as const,
  MEMO_MAX_LENGTH: 28,
} as const;

export const ACCESS = {
  DEFAULT_DURATION: 86400, // 24 hours in seconds
} as const;

export const ERRORS = {
  VALIDATION_FAILED: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  ACCESS_DENIED: 'ACCESS_DENIED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

