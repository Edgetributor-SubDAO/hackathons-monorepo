import { PrismaClient, PaymentStatus } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { NotFoundError, PaymentError } from '../lib/errors';
import {
  validateInput,
  initiatePaymentInputSchema,
  paymentHistoryInputSchema,
} from '../lib/validation';
import { CACHE_TTL } from '../lib/constants';

export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Get payment history
   */
  async getPaymentHistory(
    userAddress: string,
    serviceId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    // Validate input
    const validated = validateInput(paymentHistoryInputSchema, {
      userAddress,
      serviceId,
      limit,
      offset,
    });

    const where: any = { userAddress: validated.userAddress };
    if (validated.serviceId) {
      where.serviceId = validated.serviceId;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: validated.limit,
        skip: validated.offset,
        include: {
          service: {
            select: {
              name: true,
              serviceId: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        eventHash: p.stellarTxHash || '',
        stellarTxHash: p.stellarTxHash || '',
        userAddress: p.userAddress,
        serviceId: p.serviceId,
        amount: p.amount,
        currency: p.currency,
        timestamp: p.createdAt.toISOString(),
        status: p.status,
        polkadotTxHash: p.polkadotTxHash,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Get payment by hash
   */
  async getPaymentByHash(paymentHash: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stellarTxHash: paymentHash },
      include: {
        service: true,
        user: {
          select: {
            stellarAddress: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment', paymentHash);
    }

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        service: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    return payment;
  }

  /**
   * Initiate payment (returns payment details for frontend)
   */
  async initiatePayment(
    userAddress: string,
    serviceId: string,
    amount: string,
    currency: string
  ): Promise<{
    success: boolean;
    paymentHash?: string;
    merchantAddress: string;
    amount: string;
    currency: string;
    memo?: string;
    error?: string;
  }> {
    try {
      // Validate input
      validateInput(initiatePaymentInputSchema, {
        userAddress,
        serviceId,
        amount,
        currency,
      });

      // Get or create service
      let service = await this.prisma.service.findUnique({
        where: { serviceId },
      });

      if (!service) {
        // Create default service if it doesn't exist (for mock/dev)
        service = await this.prisma.service.create({
          data: {
            serviceId,
            name: `Service ${serviceId}`,
            description: `Access service ${serviceId}`,
            minAmount: '100',
            maxAmount: '10000',
            currency: currency,
            accessDuration: 86400, // 24 hours
            merchantAddress:
              process.env.STELLAR_MERCHANT_ADDRESS ||
              'GDEM2WAQKWKOQN7Z7KQJZ6KLNOXZXN3VNXJXZYUK3K7F5KLTQ6VKVJZK',
          },
        });
      }

      if (!service.isActive) {
        throw new PaymentError(`Service ${serviceId} is not active`);
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      const minAmount = parseFloat(service.minAmount);
      const maxAmount = service.maxAmount
        ? parseFloat(service.maxAmount)
        : Infinity;

      if (amountNum < minAmount) {
        throw new PaymentError(
          `Amount ${amount} is below minimum ${service.minAmount}`
        );
      }

      if (amountNum > maxAmount) {
        throw new PaymentError(
          `Amount ${amount} exceeds maximum ${service.maxAmount || 'unlimited'}`
        );
      }

      // Get or create user
      await this.prisma.user.upsert({
        where: { stellarAddress: userAddress },
        update: {},
        create: {
          stellarAddress: userAddress,
        },
      });

      // Generate payment memo
      const timestamp = Date.now();
      const memo = `${serviceId}:${timestamp}`;

      // Create payment record (pending status)
      const payment = await this.prisma.payment.create({
        data: {
          userAddress,
          serviceId,
          amount,
          currency,
          memo,
          status: PaymentStatus.PENDING,
        },
      });

      logger.info('Payment initiated', {
        paymentId: payment.id,
        userAddress,
        serviceId,
        amount,
        currency,
      });

      return {
        success: true,
        merchantAddress: service.merchantAddress,
        amount,
        currency,
        memo,
      };
    } catch (error) {
      logger.error('Error initiating payment', {
        error: error instanceof Error ? error.message : String(error),
        userAddress,
        serviceId,
        amount,
        currency,
      });

      if (error instanceof PaymentError || error instanceof NotFoundError) {
        throw error;
      }

      return {
        success: false,
        merchantAddress: '',
        amount,
        currency,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    stellarTxHash?: string,
    polkadotTxHash?: string
  ) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        stellarTxHash: stellarTxHash || undefined,
        polkadotTxHash: polkadotTxHash || undefined,
      },
    });

    // Clear cache if needed
    if (stellarTxHash) {
      await this.redis.del(`payment:${stellarTxHash}`);
    }

    return payment;
  }
}
