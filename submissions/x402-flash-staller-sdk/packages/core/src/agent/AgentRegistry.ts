import { AgentMetadata } from './BaseAgent';
import { EventEmitter } from 'eventemitter3';

export interface RegistryEntry {
  metadata: AgentMetadata;
  endpoint: string;
  status: 'online' | 'offline' | 'maintenance';
  stats: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    lastSeen: number;
  };
  tags: string[];
  rating?: {
    score: number;
    count: number;
  };
}

export class AgentRegistry extends EventEmitter {
  private agents: Map<string, RegistryEntry> = new Map();
  private indexByCapability: Map<string, Set<string>> = new Map();
  private indexByTag: Map<string, Set<string>> = new Map();

  /**
   * Register a new agent
   */
  register(entry: RegistryEntry): void {
    this.agents.set(entry.metadata.id, entry);

    // Index by capabilities
    for (const capability of entry.metadata.capabilities) {
      if (!this.indexByCapability.has(capability)) {
        this.indexByCapability.set(capability, new Set());
      }
      this.indexByCapability.get(capability)!.add(entry.metadata.id);
    }

    // Index by tags
    for (const tag of entry.tags) {
      if (!this.indexByTag.has(tag)) {
        this.indexByTag.set(tag, new Set());
      }
      this.indexByTag.get(tag)!.add(entry.metadata.id);
    }

    this.emit('agent-registered', entry);
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): void {
    const entry = this.agents.get(agentId);
    if (!entry) return;

    this.agents.delete(agentId);

    // Remove from indexes
    for (const capability of entry.metadata.capabilities) {
      this.indexByCapability.get(capability)?.delete(agentId);
    }

    for (const tag of entry.tags) {
      this.indexByTag.get(tag)?.delete(agentId);
    }

    this.emit('agent-unregistered', agentId);
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: string): RegistryEntry[] {
    const agentIds = this.indexByCapability.get(capability);
    if (!agentIds) return [];

    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((entry): entry is RegistryEntry => entry !== undefined)
      .filter(entry => entry.status === 'online');
  }

  /**
   * Find agents by tags
   */
  findByTags(tags: string[]): RegistryEntry[] {
    const agentSets = tags.map(tag => this.indexByTag.get(tag) || new Set());
    
    // Intersection of all sets
    if (agentSets.length === 0) return [];
    
    const intersection = agentSets.reduce((acc, set) => {
      return new Set([...acc].filter(x => set.has(x)));
    });

    return Array.from(intersection)
      .map(id => this.agents.get(id as string))
      .filter((entry): entry is RegistryEntry => entry !== undefined);
  }

  /**
   * Search agents with filters
   */
  search(filters: {
    capability?: string;
    tags?: string[];
    maxPrice?: string;
    minRating?: number;
    author?: string;
  }): RegistryEntry[] {
    let results = Array.from(this.agents.values());

    if (filters.capability) {
      results = results.filter(entry =>
        entry.metadata.capabilities.includes(filters.capability as any)
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(entry =>
        filters.tags!.every(tag => entry.tags.includes(tag))
      );
    }

    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice);
      results = results.filter(entry =>
        parseInt(entry.metadata.pricing.basePrice) <= maxPrice
      );
    }

    if (filters.minRating) {
      results = results.filter(entry =>
        entry.rating && entry.rating.score >= filters.minRating!
      );
    }

    if (filters.author) {
      results = results.filter(entry =>
        entry.metadata.author.name === filters.author ||
        entry.metadata.author.address === filters.author
      );
    }

    // Sort by rating and success rate
    results.sort((a, b) => {
      const aScore = (a.rating?.score || 0) * a.stats.successRate;
      const bScore = (b.rating?.score || 0) * b.stats.successRate;
      return bScore - aScore;
    });

    return results;
  }

  /**
   * Get agent by ID
   */
  get(agentId: string): RegistryEntry | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Update agent status
   */
  updateStatus(agentId: string, status: RegistryEntry['status']): void {
    const entry = this.agents.get(agentId);
    if (entry) {
      entry.status = status;
      entry.stats.lastSeen = Date.now();
      this.emit('agent-status-updated', { agentId, status });
    }
  }

  /**
   * Update agent stats
   */
  updateStats(agentId: string, stats: Partial<RegistryEntry['stats']>): void {
    const entry = this.agents.get(agentId);
    if (entry) {
      entry.stats = { ...entry.stats, ...stats };
      this.emit('agent-stats-updated', { agentId, stats: entry.stats });
    }
  }

  /**
   * Get all agents
   */
  getAll(): RegistryEntry[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      onlineAgents: Array.from(this.agents.values()).filter(
        e => e.status === 'online'
      ).length,
      capabilities: Array.from(this.indexByCapability.keys()),
      tags: Array.from(this.indexByTag.keys()),
    };
  }
}
