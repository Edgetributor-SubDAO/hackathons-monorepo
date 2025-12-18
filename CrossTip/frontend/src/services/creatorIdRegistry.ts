import { useState } from 'react';

// Simulated database for demo - in production this would be a backend service
interface CreatorRegistry {
  [creatorId: string]: {
    ownerAddress: string;
    claimedAt: number;
    verified: boolean;
    socialProof?: {
      platform: string;
      handle: string;
      verificationUrl?: string;
    };
  };
}

// Mock registry - would be replaced with blockchain/database storage
const mockRegistry: CreatorRegistry = {
  'gaming_steve': {
    ownerAddress: 'GABC123...',
    claimedAt: Date.now() - 86400000, // 1 day ago
    verified: true,
    socialProof: {
      platform: 'twitch',
      handle: 'gaming_steve',
      verificationUrl: 'https://twitch.tv/gaming_steve'
    }
  },
  'crypto_alice': {
    ownerAddress: 'GDEF456...',
    claimedAt: Date.now() - 3600000, // 1 hour ago
    verified: false
  }
};

interface CreatorIdService {
  checkAvailability: (creatorId: string) => Promise<{
    available: boolean;
    owner?: string;
    verified?: boolean;
    suggestedAlternatives?: string[];
  }>;
  
  claimCreatorId: (creatorId: string, walletAddress: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  
  verifyCreatorId: (creatorId: string, socialProof: any) => Promise<{
    success: boolean;
    message: string;
  }>;
}

export class CreatorIdRegistryService implements CreatorIdService {
  
  async checkAvailability(creatorId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const existing = mockRegistry[creatorId];
    
    if (!existing) {
      return {
        available: true,
        suggestedAlternatives: []
      };
    }
    
    // Generate alternatives if taken
    const alternatives = this.generateAlternatives(creatorId);
    
    return {
      available: false,
      owner: existing.ownerAddress,
      verified: existing.verified,
      suggestedAlternatives: alternatives
    };
  }
  
  async claimCreatorId(creatorId: string, walletAddress: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const existing = mockRegistry[creatorId];
    
    if (existing) {
      if (existing.ownerAddress === walletAddress) {
        return {
          success: true,
          message: 'You already own this Creator ID!'
        };
      } else {
        return {
          success: false,
          message: 'This Creator ID is already taken by another wallet'
        };
      }
    }
    
    // Claim the ID
    mockRegistry[creatorId] = {
      ownerAddress: walletAddress,
      claimedAt: Date.now(),
      verified: false
    };
    
    return {
      success: true,
      message: 'Creator ID successfully claimed to your wallet!'
    };
  }
  
  async verifyCreatorId(creatorId: string, socialProof: any) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existing = mockRegistry[creatorId];
    if (!existing) {
      return {
        success: false,
        message: 'Creator ID not found'
      };
    }
    
    // In production, this would verify the social proof
    existing.verified = true;
    existing.socialProof = socialProof;
    
    return {
      success: true,
      message: 'Creator ID verified with social proof!'
    };
  }
  
  private generateAlternatives(creatorId: string): string[] {
    const alternatives = [
      `${creatorId}_official`,
      `${creatorId}_real`,
      `${creatorId}_2024`,
      `${creatorId}_creator`,
      `the_${creatorId}`,
      `${creatorId}_tips`
    ];
    
    return alternatives.slice(0, 3); // Return top 3 suggestions
  }
}

// Hook for using the service
export const useCreatorIdRegistry = () => {
  const [service] = useState(() => new CreatorIdRegistryService());
  
  return {
    checkAvailability: service.checkAvailability.bind(service),
    claimCreatorId: service.claimCreatorId.bind(service),
    verifyCreatorId: service.verifyCreatorId.bind(service)
  };
};