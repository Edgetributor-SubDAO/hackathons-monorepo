import { AgentRequest, AgentResponse, PricingModel } from '../agent/BaseAgent';

export interface PricingConfig {
  model: PricingModel;
  basePrice: string;
  currency: string;
  tiers?: PricingTier[];
  customCalculator?: (request: AgentRequest, response?: AgentResponse) => string;
}

export interface PricingTier {
  name: string;
  threshold: number;  // Usage threshold
  priceMultiplier: number;
  description?: string;
}

export class PricingStrategy {
  private config: PricingConfig;

  constructor(config: PricingConfig) {
    this.config = config;
  }

  /**
   * Calculate cost based on pricing model
   */
  calculate(request: AgentRequest, response?: AgentResponse): string {
    switch (this.config.model) {
      case PricingModel.PER_REQUEST:
        return this.calculatePerRequest();

      case PricingModel.PER_TOKEN:
        return this.calculatePerToken(request, response);

      case PricingModel.PER_SECOND:
        return this.calculatePerSecond(response);

      case PricingModel.PER_COMPUTATION:
        return this.calculatePerComputation(response);

      case PricingModel.CUSTOM:
        if (this.config.customCalculator) {
          return this.config.customCalculator(request, response);
        }
        return this.config.basePrice;

      default:
        return this.config.basePrice;
    }
  }

  private calculatePerRequest(): string {
    return this.config.basePrice;
  }

  private calculatePerToken(request: AgentRequest, response?: AgentResponse): string {
    if (!response?.usage) {
      return this.config.basePrice;
    }

    const inputTokens = response.usage.inputTokens || 0;
    const outputTokens = response.usage.outputTokens || 0;
    const totalTokens = inputTokens + outputTokens;

    const basePriceNum = parseInt(this.config.basePrice);
    const cost = Math.ceil(basePriceNum * totalTokens / 1000); // Price per 1K tokens

    return cost.toString();
  }

  private calculatePerSecond(response?: AgentResponse): string {
    if (!response?.usage?.computeTime) {
      return this.config.basePrice;
    }

    const seconds = Math.ceil(response.usage.computeTime / 1000);
    const basePriceNum = parseInt(this.config.basePrice);
    const cost = basePriceNum * seconds;

    return cost.toString();
  }

  private calculatePerComputation(response?: AgentResponse): string {
    // Custom computation units calculation
    if (!response?.usage) {
      return this.config.basePrice;
    }

    // Example: combine tokens and compute time into "compute units"
    const tokens = (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0);
    const time = response.usage.computeTime || 0;
    const computeUnits = Math.ceil(tokens / 100 + time / 1000);

    const basePriceNum = parseInt(this.config.basePrice);
    const cost = basePriceNum * computeUnits;

    return cost.toString();
  }

  /**
   * Apply volume discounts based on usage tiers
   */
  applyTierDiscount(cost: string, usageCount: number): string {
    if (!this.config.tiers || this.config.tiers.length === 0) {
      return cost;
    }

    // Find applicable tier
    let applicableTier = this.config.tiers[0];
    for (const tier of this.config.tiers) {
      if (usageCount >= tier.threshold) {
        applicableTier = tier;
      }
    }

    const costNum = parseInt(cost);
    const discountedCost = Math.ceil(costNum * applicableTier.priceMultiplier);

    return discountedCost.toString();
  }

  /**
   * Estimate cost before execution
   */
  estimate(request: AgentRequest): { min: string; max: string; expected: string } {
    const basePrice = parseInt(this.config.basePrice);

    switch (this.config.model) {
      case PricingModel.PER_REQUEST:
        return {
          min: basePrice.toString(),
          max: basePrice.toString(),
          expected: basePrice.toString(),
        };

      case PricingModel.PER_TOKEN:
        // Estimate based on input size
        const estimatedTokens = this.estimateTokens(request.input);
        const minCost = Math.ceil(basePrice * estimatedTokens * 0.8 / 1000);
        const maxCost = Math.ceil(basePrice * estimatedTokens * 1.5 / 1000);
        const expectedCost = Math.ceil(basePrice * estimatedTokens / 1000);
        return {
          min: minCost.toString(),
          max: maxCost.toString(),
          expected: expectedCost.toString(),
        };

      default:
        return {
          min: basePrice.toString(),
          max: (basePrice * 2).toString(),
          expected: basePrice.toString(),
        };
    }
  }

  private estimateTokens(input: any): number {
    // Rough estimation: 1 token ≈ 4 characters
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    return Math.ceil(text.length / 4);
  }
}
