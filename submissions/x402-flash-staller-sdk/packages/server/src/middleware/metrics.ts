import { Request } from 'express';
import { AgentRequest, AgentResponse } from '@x402-ai/core';

interface ExecutionMetrics {
  count: number;
  totalDuration: number;
  totalCost: string;
  errors: number;
  successRate: number;
}

export class UsageTracker {
  private metrics: Map<string, ExecutionMetrics> = new Map();
  private recentRequests: Array<{
    timestamp: number;
    userId: string;
    duration: number;
    cost: string;
  }> = [];

  track(req: Request): void {
    // Track basic request info
  }

  recordExecution(
    request: AgentRequest,
    response: AgentResponse,
    duration: number
  ): void {
    const userId = request.userId;

    if (!this.metrics.has(userId)) {
      this.metrics.set(userId, {
        count: 0,
        totalDuration: 0,
        totalCost: '0',
        errors: 0,
        successRate: 100,
      });
    }

    const userMetrics = this.metrics.get(userId)!;
    userMetrics.count++;
    userMetrics.totalDuration += duration;

    const cost = response.usage?.cost || '0';
    userMetrics.totalCost = (
      BigInt(userMetrics.totalCost) + BigInt(cost)
    ).toString();

    // Track recent requests (keep last 1000)
    this.recentRequests.push({
      timestamp: Date.now(),
      userId,
      duration,
      cost,
    });

    if (this.recentRequests.length > 1000) {
      this.recentRequests.shift();
    }
  }

  recordError(userId: string): void {
    const userMetrics = this.metrics.get(userId);
    if (userMetrics) {
      userMetrics.errors++;
      userMetrics.successRate = 
        ((userMetrics.count - userMetrics.errors) / userMetrics.count) * 100;
    }
  }

  getStats() {
    const totalRequests = Array.from(this.metrics.values()).reduce(
      (sum, m) => sum + m.count,
      0
    );

    const avgDuration =
      this.recentRequests.reduce((sum, r) => sum + r.duration, 0) /
      (this.recentRequests.length || 1);

    return {
      totalRequests,
      uniqueUsers: this.metrics.size,
      avgDuration: Math.round(avgDuration),
      recentActivity: this.recentRequests.slice(-10),
      topUsers: this.getTopUsers(5),
    };
  }

  private getTopUsers(limit: number) {
    return Array.from(this.metrics.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([userId, metrics]) => ({ userId, ...metrics }));
  }
}
