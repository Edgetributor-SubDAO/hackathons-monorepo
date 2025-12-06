import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { NotFoundError } from '../lib/errors';
import { CACHE_TTL } from '../lib/constants';
import { logger } from '../utils/logger';

export class ServiceInfoService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Get service information
   */
  async getServiceInfo(serviceId: string) {
    // Check cache
    const cacheKey = `service:${serviceId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    let service = await this.prisma.service.findUnique({
      where: { serviceId },
    });

    // If service doesn't exist, return mock data (for development)
    if (!service) {
      logger.warn('Service not found, returning mock data', { serviceId });
      const mockService = {
        serviceId,
        name: `Service ${serviceId}`,
        description: `Access service ${serviceId}`,
        minAmount: '100',
        maxAmount: '10000',
        currency: 'XLM',
        accessDuration: 86400, // 24 hours
        isActive: true,
      };

      // Cache mock data for shorter time
      await this.redis.setex(cacheKey, 60, JSON.stringify(mockService));
      return mockService;
    }

    const serviceInfo = {
      serviceId: service.serviceId,
      name: service.name,
      description: service.description || null,
      minAmount: service.minAmount,
      maxAmount: service.maxAmount || null,
      currency: service.currency,
      accessDuration: service.accessDuration,
      isActive: service.isActive,
    };

    // Cache for configured TTL
    await this.redis.setex(
      cacheKey,
      CACHE_TTL.SERVICE_INFO,
      JSON.stringify(serviceInfo)
    );

    return serviceInfo;
  }

  /**
   * Create or update service
   */
  async upsertService(data: {
    serviceId: string;
    name: string;
    description?: string;
    minAmount: string;
    maxAmount?: string;
    currency?: string;
    accessDuration: number;
    merchantAddress: string;
    isActive?: boolean;
  }) {
    const service = await this.prisma.service.upsert({
      where: { serviceId: data.serviceId },
      update: {
        name: data.name,
        description: data.description,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        currency: data.currency || 'XLM',
        accessDuration: data.accessDuration,
        merchantAddress: data.merchantAddress,
        isActive: data.isActive ?? true,
      },
      create: {
        serviceId: data.serviceId,
        name: data.name,
        description: data.description,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        currency: data.currency || 'XLM',
        accessDuration: data.accessDuration,
        merchantAddress: data.merchantAddress,
        isActive: data.isActive ?? true,
      },
    });

    // Clear cache
    await this.redis.del(`service:${data.serviceId}`);

    return service;
  }
}
