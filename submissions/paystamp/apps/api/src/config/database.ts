/**
 * Database configuration and connection utilities
 */
import { PrismaClient } from '@prisma/client';
import { getEnvConfig } from './env';
import { logger } from '../utils/logger';

let prismaClient: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  const config = getEnvConfig();

  prismaClient = new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  });

  // Handle connection events
  prismaClient.$on('error' as never, (e: never) => {
    logger.error('Prisma error', { error: e });
  });

  return prismaClient;
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  const client = getPrismaClient();
  const config = getEnvConfig();
  
  try {
    await client.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    if (config.NODE_ENV === 'development') {
      logger.warn('Database connection failed in development mode. Server will continue but database features will be unavailable.', {
        error: error instanceof Error ? error.message : String(error),
      });
      logger.warn('To fix this, set up a database (see SETUP_CLOUD_DB.md or DATABASE_SETUP.md)');
      // Don't throw in development - allow server to start
      return;
    }
    logger.error('Failed to connect to database', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    logger.info('Database disconnected');
  }
}

/**
 * Health check database connection
 */
export async function healthCheckDatabase(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

