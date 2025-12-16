import { BaseAgent, AgentRequest, AgentResponse, AgentCapability, PricingModel } from '@x402-ai/core';
import OpenAI from 'openai';

export class OpenAIAgent extends BaseAgent {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4', stellarAddress?: string) {
    super({
      id: `openai-${model}`,
      name: `OpenAI ${model}`,
      description: `Access to OpenAI ${model} via x402-flash micropayments`,
      version: '1.0.0',
      author: {
        name: 'OpenAI Agent Provider',
        address: stellarAddress,
      },
      capabilities: [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.CODE_GENERATION,
        AgentCapability.FUNCTION_CALLING,
      ],
      pricing: {
        model: PricingModel.PER_TOKEN,
        basePrice: '100', // 100 stroops per 1K tokens
        currency: 'NATIVE', // XLM or specify token address
        details: {
          model,
          inputTokenPrice: '100',
          outputTokenPrice: '150',
        },
      },
    });

    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async initialize(): Promise<void> {
    // Test API key
    try {
      await this.openai.models.list();
      this.initialized = true;
      console.log('✅ OpenAI agent initialized');
    } catch (error) {
      throw new Error('Failed to initialize OpenAI agent');
    }
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    this.validateRequest(request);

    const startTime = Date.now();

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: request.input }],
        ...request.parameters,
      });

      const response: AgentResponse = {
        id: completion.id,
        requestId: request.id,
        agentId: this.metadata.id,
        output: completion.choices[0].message.content,
        usage: {
          inputTokens: completion.usage?.prompt_tokens,
          outputTokens: completion.usage?.completion_tokens,
          computeTime: Date.now() - startTime,
          cost: this.calculateCost(request, {
            usage: {
              inputTokens: completion.usage?.prompt_tokens,
              outputTokens: completion.usage?.completion_tokens,
            },
          } as any),
        },
        metadata: {
          model: completion.model,
          finishReason: completion.choices[0].finish_reason,
        },
        timestamp: Date.now(),
      };

      return response;
    } catch (error: any) {
      throw new Error(`OpenAI error: ${error.message}`);
    }
  }

  calculateCost(request: AgentRequest, response?: AgentResponse): string {
    if (!response?.usage) {
      return this.metadata.pricing.basePrice;
    }

    const inputTokens = response.usage.inputTokens || 0;
    const outputTokens = response.usage.outputTokens || 0;

    const inputPriceStr = this.metadata.pricing.details?.inputTokenPrice || this.metadata.pricing.basePrice;
    const outputPriceStr = this.metadata.pricing.details?.outputTokenPrice || this.metadata.pricing.basePrice;

    const inputCost = Math.ceil(
      (inputTokens / 1000) * parseInt(inputPriceStr)
    );
    const outputCost = Math.ceil(
      (outputTokens / 1000) * parseInt(outputPriceStr)
    );

    return (inputCost + outputCost).toString();
  }
}
