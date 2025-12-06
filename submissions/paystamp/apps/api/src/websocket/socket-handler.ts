import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { pubsub } from '../resolvers';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export class SocketHandler {
  private io: SocketIOServer;

  constructor(
    httpServer: HTTPServer,
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    // Get CORS origin from config or environment
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true, // Allow Engine.IO v3 clients
    });
    
    logger.info('Socket.IO server initialized', {
      corsOrigin,
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.setupPubSubListeners();
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Socket client connected', { socketId: socket.id });

      // Join room for user
      socket.on('join:user', async (data: { userAddress: string }) => {
        const room = `user:${data.userAddress}`;
        socket.join(room);
        logger.debug('Socket joined user room', {
          socketId: socket.id,
          room,
        });
      });

      // Join room for service
      socket.on('join:service', async (data: { serviceId: string }) => {
        const room = `service:${data.serviceId}`;
        socket.join(room);
        logger.debug('Socket joined service room', {
          socketId: socket.id,
          room,
        });
      });

      // Join room for payment
      socket.on('join:payment', async (data: { paymentHash: string }) => {
        const room = `payment:${data.paymentHash}`;
        socket.join(room);
        logger.debug('Socket joined payment room', {
          socketId: socket.id,
          room,
        });
      });

      socket.on('disconnect', () => {
        logger.info('Socket client disconnected', { socketId: socket.id });
      });

      socket.on('error', (error) => {
        logger.error('Socket error', {
          socketId: socket.id,
          error: error.message,
        });
      });
    });
  }

  /**
   * Setup PubSub listeners to broadcast to Socket.io
   */
  private setupPubSubListeners(): void {
    // Listen for access status changes
    pubsub.subscribe('access:*', (payload: any) => {
      const { userAddress, serviceId, ...data } = payload;
      const room = `user:${userAddress}`;
      this.io.to(room).emit('access:status:changed', {
        userAddress,
        serviceId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Listen for payment updates
    pubsub.subscribe('payment:*', (payload: any) => {
      const { paymentHash, ...data } = payload;
      const room = `payment:${paymentHash}`;
      this.io.to(room).emit('payment:processed', {
        paymentHash,
        ...data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Broadcast access status update
   */
  broadcastAccessUpdate(
    userAddress: string,
    serviceId: string,
    data: any
  ): void {
    const room = `user:${userAddress}`;
    this.io.to(room).emit('access:status:changed', {
      userAddress,
      serviceId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast payment update
   */
  broadcastPaymentUpdate(paymentHash: string, data: any): void {
    const room = `payment:${paymentHash}`;
    this.io.to(room).emit('payment:processed', {
      paymentHash,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}

