import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { NotFoundError } from '../lib/errors';
import {
  validateInput,
  accessStatusInputSchema,
} from '../lib/validation';
import { CACHE_TTL } from '../lib/constants';

export class AccessService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Get access status for user and service
   */
  async getAccessStatus(
    userAddress: string,
    serviceId: string
  ): Promise<{
    hasAccess: boolean;
    expiresAt: number | null;
    isExpired: boolean;
    nftId: string | null;
  }> {
    // Validate input
    validateInput(accessStatusInputSchema, { userAddress, serviceId });

    // Check cache first
    const cacheKey = `access:${userAddress}:${serviceId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const stamp = await this.prisma.accessStamp.findFirst({
      where: {
        userAddress,
        serviceId,
        isActive: true,
      },
      orderBy: {
        expiresAt: 'desc',
      },
    });

    const now = new Date();
    const hasAccess = stamp
      ? stamp.expiresAt > now && stamp.isActive
      : false;
    const expiresAt = stamp
      ? Math.floor(stamp.expiresAt.getTime() / 1000)
      : null;
    const isExpired = stamp ? stamp.expiresAt <= now : true;

    const result = {
      hasAccess,
      expiresAt,
      isExpired,
      nftId: stamp?.nftId || null,
    };

    // Cache for configured TTL
    await this.redis.setex(
      cacheKey,
      CACHE_TTL.ACCESS_STATUS,
      JSON.stringify(result)
    );

    return result;
  }

  /**
   * Get user's access stamps
   */
  async getUserAccessStamps(userAddress: string) {
    // Check cache
    const cacheKey = `stamps:${userAddress}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const stamps = await this.prisma.accessStamp.findMany({
      where: {
        userAddress,
        isActive: true,
      },
      include: {
        service: {
          select: {
            name: true,
            serviceId: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'desc',
      },
    });

    const result = stamps.map((stamp) => ({
      id: stamp.id,
      userAddress: stamp.userAddress,
      serviceId: stamp.serviceId,
      nftId: stamp.nftId,
      expiresAt: stamp.expiresAt.toISOString(),
      isActive: stamp.isActive,
      mintedAt: stamp.mintedAt?.toISOString() || null,
      createdAt: stamp.createdAt.toISOString(),
    }));

    // Cache result
    await this.redis.setex(
      cacheKey,
      CACHE_TTL.USER_STAMPS,
      JSON.stringify(result)
    );

    return result;
  }

  /**
   * Verify access
   */
  async verifyAccess(
    userAddress: string,
    serviceId: string
  ): Promise<{
    isValid: boolean;
    hasAccess: boolean;
    expiresAt: number | null;
    error?: string;
  }> {
    try {
      const status = await this.getAccessStatus(userAddress, serviceId);
      return {
        isValid: true,
        hasAccess: status.hasAccess,
        expiresAt: status.expiresAt,
      };
    } catch (error) {
      logger.error('Error verifying access', {
        error: error instanceof Error ? error.message : String(error),
        userAddress,
        serviceId,
      });
      return {
        isValid: false,
        hasAccess: false,
        expiresAt: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create or update access stamp
   */
  async createAccessStamp(
    userAddress: string,
    serviceId: string,
    expiresAt: Date,
    nftId?: string
  ) {
    // Get or create user
    await this.prisma.user.upsert({
      where: { stellarAddress: userAddress },
      update: {},
      create: {
        stellarAddress: userAddress,
      },
    });

    // Deactivate old stamps for this user/service combination
    await this.prisma.accessStamp.updateMany({
      where: {
        userAddress,
        serviceId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Create new access stamp
    const stamp = await this.prisma.accessStamp.create({
      data: {
        userAddress,
        serviceId,
        expiresAt,
        nftId: nftId || null,
        isActive: true,
        mintedAt: nftId ? new Date() : null,
      },
    });

    // Clear cache
    await this.redis.del(`access:${userAddress}:${serviceId}`);
    await this.redis.del(`stamps:${userAddress}`);

    logger.info('Access stamp created', {
      stampId: stamp.id,
      userAddress,
      serviceId,
      expiresAt: expiresAt.toISOString(),
    });

    return stamp;
  }
}
