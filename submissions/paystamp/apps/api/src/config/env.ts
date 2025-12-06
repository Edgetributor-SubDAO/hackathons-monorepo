/**
 * Environment variable validation and configuration
 */
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // API Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_PORT: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10))
    .default('4000'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  API_KEY_SECRET: z
    .string()
    .min(32, 'API_KEY_SECRET must be at least 32 characters')
    .optional(),

  // Stellar Configuration
  STELLAR_NETWORK: z
    .enum(['testnet', 'mainnet', 'futurenet'])
    .default('testnet'),
  STELLAR_MERCHANT_ADDRESS: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),
});

type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig | null = null;

/**
 * Get validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  if (envConfig) {
    return envConfig;
  }

  try {
    envConfig = envSchema.parse(process.env);
    return envConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      });
      throw new Error(
        `Invalid environment configuration:\n${issues.join('\n')}`
      );
    }
    throw error;
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

