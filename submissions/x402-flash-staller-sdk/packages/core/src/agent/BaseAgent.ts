import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Agent capability types
export enum AgentCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  IMAGE_GENERATION = 'image_generation',
  AUDIO_GENERATION = 'audio_generation',
  EMBEDDING = 'embedding',
  CLASSIFICATION = 'classification',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  FUNCTION_CALLING = 'function_calling',
  CUSTOM = 'custom',
}

// Pricing models
export enum PricingModel {
  PER_REQUEST = 'per_request',           // Fixed price per call
  PER_TOKEN = 'per_token',               // Price per input/output token
  PER_SECOND = 'per_second',             // Time-based
  PER_COMPUTATION = 'per_computation',   // Compute units
  SUBSCRIPTION = 'subscription',          // Monthly/daily pass
  CUSTOM = 'custom',
}

// Agent metadata schema
export const AgentMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.object({
    name: z.string(),
    address: z.string().optional(),
    contact: z.string().optional(),
  }),
  capabilities: z.array(z.nativeEnum(AgentCapability)),
  pricing: z.object({
    model: z.nativeEnum(PricingModel),
    basePrice: z.string(),            // In stroops or token units
    currency: z.string(),              // Token contract address
    details: z.record(z.any()).optional(),
  }),
  limits: z.object({
    maxRequestsPerMinute: z.number().optional(),
    maxTokensPerRequest: z.number().optional(),
    maxConcurrentRequests: z.number().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

// Agent request/response types
export interface AgentRequest {
  id: string;
  agentId: string;
  userId: string;
  capability: AgentCapability;
  input: any;
  parameters?: Record<string, any>;
  timestamp: number;
}

export interface AgentResponse {
  id: string;
  requestId: string;
  agentId: string;
  output: any;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    computeTime?: number;
    cost?: string;
  };
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
}

// Base Agent class that all AI agents extend
export abstract class BaseAgent extends EventEmitter {
  protected metadata: AgentMetadata;
  protected initialized: boolean = false;

  constructor(metadata: AgentMetadata) {
    super();
    this.metadata = AgentMetadataSchema.parse(metadata);
  }

  // Initialize the agent (load models, connect to APIs, etc.)
  abstract initialize(): Promise<void>;

  // Main execution method
  abstract execute(request: AgentRequest): Promise<AgentResponse>;

  // Validate request before execution
  protected validateRequest(request: AgentRequest): void {
    if (!this.metadata.capabilities.includes(request.capability)) {
      throw new Error(`Agent does not support capability: ${request.capability}`);
    }
  }

  // Calculate cost for a request
  abstract calculateCost(request: AgentRequest, response?: AgentResponse): string;

  // Health check
  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  // Get agent metadata
  getMetadata(): AgentMetadata {
    return { ...this.metadata };
  }

  // Update pricing
  updatePricing(pricing: AgentMetadata['pricing']): void {
    this.metadata.pricing = pricing;
    this.emit('pricing-updated', pricing);
  }

  // Shutdown agent
  async shutdown(): Promise<void> {
    this.initialized = false;
    this.emit('shutdown');
  }
}
