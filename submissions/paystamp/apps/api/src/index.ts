import express from 'express';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import Redis from 'ioredis';
import { schema } from './schema';
import { GraphQLContext } from './types/context';
import { authMiddleware, extractAuth } from './middleware/auth';
import {
  createRateLimiter,
  createSlowDown,
  createGraphQLRateLimiter,
} from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { SocketHandler } from './websocket/socket-handler';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { formatError } from './resolvers';
import { getPrismaClient, connectDatabase, disconnectDatabase } from './config/database';
import { getEnvConfig } from './config/env';

class APIServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private prisma = getPrismaClient();
  private redis: Redis;
  private apolloServer?: ApolloServer<GraphQLContext>;
  private socketHandler?: SocketHandler;
  private isShuttingDown = false;
  private env = getEnvConfig();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);

    // Initialize Redis (with error handling for development)
    try {
    this.redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
        retryStrategy: (times) => {
          if (this.env.NODE_ENV === 'development' && times > 3) {
            // In development, give up after 3 retries and use fallback
            logger.warn('Redis connection failed after retries. Using in-memory fallback.');
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true, // Don't connect immediately
      });

      // Handle Redis errors gracefully in development
      this.redis.on('error', (error) => {
        if (this.env.NODE_ENV === 'development') {
          logger.warn('Redis error (development mode):', { error: error.message });
        } else {
          logger.error('Redis error:', { error: error.message });
        }
      });
    } catch (error) {
      if (this.env.NODE_ENV === 'development') {
        logger.warn('Failed to initialize Redis. Using in-memory fallback.');
        // Create a mock Redis-like object
        this.redis = {
          ping: async () => 'PONG',
          get: async () => null,
          set: async () => 'OK',
          del: async () => 0,
          quit: async () => 'OK',
          on: () => {},
        } as any;
      } else {
        throw error;
      }
    }

    this.setupGracefulShutdown();
  }

  /**
   * Initialize and start the API server
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting PayStamp API Server', {
        version: '1.0.0',
        nodeEnv: this.env.NODE_ENV,
        port: config.port,
      });

      // Verify database connection
      await connectDatabase();

      // Verify Redis connection (optional in development)
      try {
        if (this.redis instanceof Redis) {
          await this.redis.connect();
        }
      await this.redis.ping();
      logger.info('Redis connected');
      } catch (error) {
        if (this.env.NODE_ENV === 'development') {
          logger.warn('Redis connection failed in development mode. Using in-memory fallback.', {
            error: error instanceof Error ? error.message : String(error),
          });
          logger.warn('To fix this, set up Redis (see SETUP_CLOUD_DB.md or DATABASE_SETUP.md)');
          // Create a mock Redis-like object for development
          this.redis = {
            ping: async () => 'PONG',
            get: async () => null,
            set: async () => 'OK',
            del: async () => 0,
            quit: async () => 'OK',
            connect: async () => {},
            on: () => {},
          } as any;
        } else {
          throw error;
        }
      }

      // Setup middleware
      this.setupMiddleware();

      // Setup Apollo Server
      await this.setupApolloServer();

      // Setup Socket.io
      this.setupSocketIO();

      // Start HTTP server
      this.httpServer.listen(config.port, () => {
        logger.info(`API server listening on port ${config.port}`);
        logger.info(`GraphQL endpoint: http://localhost:${config.port}/graphql`);
        logger.info(`Health check: http://localhost:${config.port}/health`);
      });
    } catch (error) {
      logger.error('Failed to start API server', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
      })
    );

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Authentication
    this.app.use(authMiddleware);

    // Rate limiting
    this.app.use(createRateLimiter(this.redis));
    this.app.use(createSlowDown());

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'paystamp-api',
        database: 'unknown',
        redis: 'unknown',
      };

      // Check database
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        health.database = 'connected';
      } catch (error) {
        health.database = 'disconnected';
        if (this.env.NODE_ENV === 'production') {
          health.status = 'degraded';
        }
      }
        
        // Check Redis
      try {
        await this.redis.ping();
        health.redis = 'connected';
      } catch (error) {
        health.redis = 'disconnected';
        if (this.env.NODE_ENV === 'production') {
          health.status = 'degraded';
        }
      }

      const statusCode = health.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Setup Apollo Server
   */
  private async setupApolloServer(): Promise<void> {
    this.apolloServer = new ApolloServer<GraphQLContext>({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
      ],
      introspection: this.env.NODE_ENV !== 'production',
      formatError,
    });

    await this.apolloServer.start();

    // GraphQL endpoint with rate limiting
    this.app.use(
      '/graphql',
      createGraphQLRateLimiter(this.redis),
      expressMiddleware(this.apolloServer, {
        context: async ({ req }): Promise<GraphQLContext> => {
          const auth = extractAuth(req);
          return {
            prisma: this.prisma,
            redis: this.redis,
            io: this.socketHandler?.getIO()!,
            req,
            userId: auth.userId,
            isAdmin: auth.isAdmin,
          };
        },
      })
    );

    logger.info('Apollo Server started');
  }

  /**
   * Setup Socket.io
   */
  private setupSocketIO(): void {
    this.socketHandler = new SocketHandler(
      this.httpServer,
      this.prisma,
      this.redis
    );
    logger.info('Socket.io initialized');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new connections
        this.httpServer.close(() => {
          logger.info('HTTP server closed');
        });

        // Close Apollo Server
        if (this.apolloServer) {
          await this.apolloServer.stop();
          logger.info('Apollo Server stopped');
        }

        // Close Socket.io
        if (this.socketHandler) {
          this.socketHandler.getIO().close();
          logger.info('Socket.io closed');
        }

        // Disconnect Redis
        if (this.redis && typeof this.redis.quit === 'function') {
        await this.redis.quit();
        logger.info('Redis disconnected');
        }

        // Disconnect database
        await disconnectDatabase();

        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', {
          error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: promise.toString(),
      });
    });
  }

  /**
   * Shutdown the server
   */
  async shutdown(): Promise<void> {
    // Handled by graceful shutdown
  }
}

// Start the server
if (require.main === module) {
  const server = new APIServer();
  server.start().catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });
}

export default APIServer;

