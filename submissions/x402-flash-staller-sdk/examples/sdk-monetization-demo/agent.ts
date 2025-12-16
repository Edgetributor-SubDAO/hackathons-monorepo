// EchoAgent - A simple AI agent that extends BaseAgent from @x402-ai/core
import {
  BaseAgent,
  AgentCapability,
  PricingModel,
  AgentMetadata,
  AgentRequest,
  AgentResponse,
} from "@x402-ai/core";

export class EchoAgent extends BaseAgent {
  constructor() {
    const metadata: AgentMetadata = {
      id: "echo-agent-v1",
      name: "Echo AI Agent",
      description:
        "A simple AI agent that echoes messages with AI-like responses",
      version: "1.0.0",
      author: {
        name: "x402-Flash Demo",
        address: "GDUTKZYSPCITQVMC27AS4QLE5RSZ6MQOWFXDM23YVRKMQG55Q7HGNRT5",
      },
      capabilities: [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.SUMMARIZATION,
      ],
      pricing: {
        model: PricingModel.PER_REQUEST,
        basePrice: "1000", // 1000 stroops per request
        currency: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        details: {
          description: "Fixed 1000 stroops per AI request",
          minimumPayment: "1000",
        },
      },
      limits: {
        maxRequestsPerMinute: 60,
        maxTokensPerRequest: 2000,
        maxConcurrentRequests: 10,
      },
      metadata: {
        tags: ["demo", "echo", "simple"],
        exampleInputs: ["Hello AI!", "What is the meaning of life?"],
      },
    };

    super(metadata);
  }

  async initialize(): Promise<void> {
    console.log("🤖 Initializing Echo AI Agent...");
    // In a real agent, you would load models, connect to APIs, etc.
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.initialized = true;
    console.log("✅ Echo AI Agent initialized");
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    this.validateRequest(request);

    const startTime = Date.now();
    const input = request.input as string;

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate AI-like response
    let output: string;
    const inputLower = input.toLowerCase();

    if (inputLower.includes("hello") || inputLower.includes("hi")) {
      output = `Hello! I'm the Echo AI Agent. You said: "${input}". How can I assist you today?`;
    } else if (inputLower.includes("help")) {
      output = `I'm here to help! I can echo your messages with AI-enhanced responses. My capabilities include text generation and summarization. You said: "${input}"`;
    } else if (inputLower.includes("meaning of life")) {
      output = `The meaning of life is 42, according to Douglas Adams. But you asked: "${input}". From my AI perspective, life's meaning is to process requests and provide helpful responses!`;
    } else if (inputLower.includes("weather")) {
      output = `I don't have real-time weather data, but I received your message: "${input}". For actual weather, please use a specialized weather API!`;
    } else {
      output = `I received your message: "${input}". Let me echo that back with some AI flair: This is an interesting input that demonstrates the x402-Flash micropayment system in action!`;
    }

    const computeTime = Date.now() - startTime;
    const inputTokens = Math.ceil(input.length / 4); // Rough token estimate
    const outputTokens = Math.ceil(output.length / 4);
    const cost = this.calculateCost(request);

    const response: AgentResponse = {
      id: `res-${Date.now()}`,
      requestId: request.id,
      agentId: this.metadata.id,
      output,
      usage: {
        inputTokens,
        outputTokens,
        computeTime,
        cost,
      },
      metadata: {
        model: "echo-v1",
        processingTime: computeTime,
        capability: request.capability,
      },
      timestamp: Date.now(),
    };

    return response;
  }

  calculateCost(request: AgentRequest, response?: AgentResponse): string {
    // Fixed cost per request
    return this.metadata.pricing.basePrice;
  }
}
