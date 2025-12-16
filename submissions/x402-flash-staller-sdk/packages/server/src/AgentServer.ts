import express, { Express, Request, Response, NextFunction } from 'express';
import { BaseAgent, AgentRequest, AgentResponse } from '@x402-ai/core';
import { X402FlashServer } from '@x402-flash/stellar-sdk';
import { v4 as uuidv4 } from 'uuid';
import { UsageTracker } from './middleware/metrics';
import { RateLimiter } from './middleware/rateLimit';

export interface AgentServerConfig {
  port: number;
  stellar: {
    rpcUrl: string;
    networkPassphrase: string;
    contractId: string;
    secretKey: string;
    paymentAddress: string;
  };
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export class AgentServer {
  private app: Express;
  private agent: BaseAgent;
  private config: AgentServerConfig;
  private x402Server: X402FlashServer;
  private usageTracker: UsageTracker;
  private rateLimiter: RateLimiter;

  constructor(agent: BaseAgent, config: AgentServerConfig) {
    this.agent = agent;
    this.config = config;
    this.app = express();

    // Initialize x402-flash
    this.x402Server = new X402FlashServer(config.stellar);

    // Initialize tracking
    this.usageTracker = new UsageTracker();
    this.rateLimiter = new RateLimiter(
      config.rateLimit || { windowMs: 60000, maxRequests: 100 }
    );

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // CORS
    if (this.config.cors) {
      this.app.use((req, res, next) => {
        const origin = this.config.cors!.origin;
        if (typeof origin === 'string') {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          const requestOrigin = req.headers.origin;
          if (requestOrigin && origin.includes(requestOrigin)) {
            res.header('Access-Control-Allow-Origin', requestOrigin);
          }
        }
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Payment');
        if (this.config.cors!.credentials) {
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        if (req.method === 'OPTIONS') {
          return res.sendStatus(200);
        }
        next();
      });
    }

    // JSON parser
    this.app.use(express.json({ limit: '10mb' }));

    // Usage tracking
    this.app.use((req, res, next) => {
      this.usageTracker.track(req);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        agent: this.agent.getMetadata(),
        uptime: process.uptime(),
      });
    });

    // Agent metadata
    this.app.get('/metadata', (req, res) => {
      res.json(this.agent.getMetadata());
    });

    // Main execution endpoint with x402 payment
    this.app.post(
      '/execute',
      this.rateLimiter.middleware(),
      this.createPaymentMiddleware(),
      async (req, res) => {
        try {
          const agentRequest: AgentRequest = {
            id: uuidv4(),
            agentId: this.agent.getMetadata().id,
            userId: req.body.userId || 'anonymous',
            capability: req.body.capability,
            input: req.body.input,
            parameters: req.body.parameters,
            timestamp: Date.now(),
          };

          // Execute agent
          const startTime = Date.now();
          const response = await this.agent.execute(agentRequest);
          const duration = Date.now() - startTime;

          // Track metrics
          this.usageTracker.recordExecution(agentRequest, response, duration);

          res.json(response);
        } catch (error: any) {
          console.error('Execution error:', error);
          res.status(500).json({
            error: {
              code: 'EXECUTION_ERROR',
              message: error.message,
            },
          });
        }
      }
    );

    // Streaming endpoint (for real-time responses)
    this.app.post(
      '/stream',
      this.rateLimiter.middleware(),
      this.createPaymentMiddleware(),
      async (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const agentRequest: AgentRequest = {
            id: uuidv4(),
            agentId: this.agent.getMetadata().id,
            userId: req.body.userId || 'anonymous',
            capability: req.body.capability,
            input: req.body.input,
            parameters: { ...req.body.parameters, stream: true },
            timestamp: Date.now(),
          };

          // Listen to agent events
          this.agent.on('chunk', (chunk) => {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          });

          const response = await this.agent.execute(agentRequest);

          res.write(`data: ${JSON.stringify({ type: 'done', data: response })}\n\n`);
          res.end();
        } catch (error: any) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
          res.end();
        }
      }
    );

    // Usage statistics
    this.app.get('/stats', (req, res) => {
      res.json(this.usageTracker.getStats());
    });

    // Pricing estimate
    this.app.post('/estimate', (req, res) => {
      try {
        const mockRequest: AgentRequest = {
          id: 'estimate',
          agentId: this.agent.getMetadata().id,
          userId: 'estimate',
          capability: req.body.capability,
          input: req.body.input,
          parameters: req.body.parameters,
          timestamp: Date.now(),
        };

        const estimate = this.agent.calculateCost(mockRequest);
        res.json({ estimate });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  private createPaymentMiddleware() {
    const metadata = this.agent.getMetadata();

    return this.x402Server.middleware({
      'POST /execute': {
        price: metadata.pricing.basePrice,
        token: metadata.pricing.currency,
        network: 'stellar-testnet',
      },
      'POST /stream': {
        price: metadata.pricing.basePrice,
        token: metadata.pricing.currency,
        network: 'stellar-testnet',
      },
    });
  }

  async start(): Promise<void> {
    await this.agent.initialize();

    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`🤖 Agent server running on port ${this.config.port}`);
        console.log(`📝 Agent: ${this.agent.getMetadata().name}`);
        console.log(`💳 Payments: ${this.config.stellar.paymentAddress}`);
        resolve();
      });
    });
  }
}
