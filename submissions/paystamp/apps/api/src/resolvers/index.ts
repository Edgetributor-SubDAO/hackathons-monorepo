import { GraphQLContext } from '../types/context';
import { AccessService, PaymentService, ServiceInfoService } from '../services';
import { PubSub } from 'graphql-subscriptions';
import { PaymentStatus } from '@prisma/client';
import { formatGraphQLError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// PubSub instance for subscriptions
export const pubsub = new PubSub();

export const resolvers = {
  Query: {
    getAccessStatus: async (
      _: unknown,
      args: { userAddress: string; serviceId: string },
      context: GraphQLContext
    ) => {
      try {
        const accessService = new AccessService(context.prisma, context.redis);
        const status = await accessService.getAccessStatus(
          args.userAddress,
          args.serviceId
        );

        return {
          ...status,
          serviceId: args.serviceId,
          userAddress: args.userAddress,
        };
      } catch (error) {
        logger.error('Error in getAccessStatus resolver', {
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        throw error;
      }
    },

    getPaymentHistory: async (
      _: unknown,
      args: {
        userAddress: string;
        serviceId?: string;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext
    ) => {
      try {
        const paymentService = new PaymentService(
          context.prisma,
          context.redis
        );
        return paymentService.getPaymentHistory(
          args.userAddress,
          args.serviceId,
          args.limit || 50,
          args.offset || 0
        );
      } catch (error) {
        logger.error('Error in getPaymentHistory resolver', {
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        throw error;
      }
    },

    getServiceInfo: async (
      _: unknown,
      args: { serviceId: string },
      context: GraphQLContext
    ) => {
      try {
        const serviceInfoService = new ServiceInfoService(
          context.prisma,
          context.redis
        );
        return serviceInfoService.getServiceInfo(args.serviceId);
      } catch (error) {
        logger.error('Error in getServiceInfo resolver', {
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        throw error;
      }
    },

    getUserAccessStamps: async (
      _: unknown,
      args: { userAddress: string },
      context: GraphQLContext
    ) => {
      try {
        const accessService = new AccessService(context.prisma, context.redis);
        return accessService.getUserAccessStamps(args.userAddress);
      } catch (error) {
        logger.error('Error in getUserAccessStamps resolver', {
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        throw error;
      }
    },
  },

  Mutation: {
    initiatePayment: async (
      _: unknown,
      args: {
        userAddress: string;
        serviceId: string;
        amount: string;
        currency: string;
      },
      context: GraphQLContext
    ) => {
      try {
        const paymentService = new PaymentService(
          context.prisma,
          context.redis
        );
        return paymentService.initiatePayment(
          args.userAddress,
          args.serviceId,
          args.amount,
          args.currency
        );
      } catch (error) {
        logger.error('Error in initiatePayment resolver', {
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        throw error;
      }
    },

    verifyAccess: async (
      _: unknown,
      args: { userAddress: string; serviceId: string },
      context: GraphQLContext
    ) => {
      try {
        const accessService = new AccessService(context.prisma, context.redis);
        return accessService.verifyAccess(args.userAddress, args.serviceId);
      } catch (error) {
        logger.error('Error in verifyAccess resolver', {
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        throw error;
      }
    },
  },

  Subscription: {
    accessStatusChanged: {
      subscribe: async (
        _: unknown,
        args: { userAddress: string; serviceId: string },
        context: GraphQLContext
      ) => {
        const channel = `access:${args.userAddress}:${args.serviceId}`;
        return pubsub.asyncIterator(channel);
      },
    },

    paymentProcessed: {
      subscribe: async (
        _: unknown,
        args: { paymentHash: string },
        context: GraphQLContext
      ) => {
        const channel = `payment:${args.paymentHash}`;
        return pubsub.asyncIterator(channel);
      },
    },
  },

  Payment: {
    status: (parent: { status: PaymentStatus }) => {
      return parent.status as PaymentStatus;
    },
  },
};

/**
 * Format errors for Apollo Server
 */
export const formatError = (err: any) => {
  if (err.originalError) {
    return formatGraphQLError(err);
  }
  return err;
};
