// =============================================================================
// POLKADOT (INK!) BLOCKCHAIN SERVICE
// =============================================================================
//
// This file contains all Polkadot blockchain interactions using dedot + typeink.
// The registry contract handles: project metadata, deliverable submissions, approvals.
//
// Documentation: https://docs.dedot.dev/typink/getting-started/migrate-from-existing-dapp
// SubWallet Documentation: https://docs.subwallet.app/
//
// Setup:
// 1. pnpm install dedot typink
// 2. Wrap app with TypinkProvider in main.tsx (see main.tsx)
// 3. Use useTypink() hook in components for wallet connection
// 4. Contract interactions via dedot client
// =============================================================================

import type { Signer } from 'dedot/types';

// Environment variables
const CONTRACT_ADDRESS = import.meta.env.VITE_POLKADOT_CONTRACT_ADDRESS;

// =============================================================================
// TYPES
// =============================================================================

export interface PolkadotProject {
  projectId: string;
  title: string;
  descriptionHash: string;
  milestoneCount: number;
  createdAt: number;
}

export interface DeliverableRecord {
  milestoneId: number;
  deliverableHash: string;
  submittedAt: number;
  approved: boolean;
}

export interface TypinkAccount {
  address: string;
  name?: string;
  type?: string;
}

// =============================================================================
// WALLET INTEGRATION NOTES
// =============================================================================
//
// With typeink + dedot, wallet integration is handled via:
//
// 1. TypinkProvider wrapper in main.tsx
//    - Manages wallet connections
//    - Provides useTypink() hook
//    - Supports SubWallet, Talisman, PolkadotJS
//
// 2. useTypink() hook in components
//    - Access: wallets, connectedWalletIds, accounts, connectedAccount, signer
//    - Actions: connectWallet(), disconnect(), setConnectedAccount()
//
// 3. Contract interactions
//    - Use dedot client from TypinkProvider
//    - Pass signer for transactions
//    - Type-safe via generated contract types

// =============================================================================
// CONTRACT INTERACTIONS (Write Operations)
// =============================================================================
//
// NOTE: These functions are called from components that have access to:
// - useTypink() hook for wallet/signer
// - dedot client from TypinkProvider
//
// Usage in component:
// const { signer, connectedAccount } = useTypink();
// const client = useTypinkClient(); // or from context
// await registerProject(..., signer, client);

export async function registerProject(
  projectId: string,
  title: string,
  descriptionHash: string,
  milestoneCount: number,
  signer: Signer,
  client: any // dedot client
): Promise<string> {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    // Get contract instance from client
    // const contract = client.contract.ProjectRegistry(CONTRACT_ADDRESS);
    
    // Call contract method with signer
    // const result = await contract.tx.registerProject(
    //   { signer },
    //   projectId,
    //   title,
    //   descriptionHash,
    //   milestoneCount
    // );
    
    // TODO: Implement once dedot client is available in components
    console.log('registerProject called:', { projectId, title, descriptionHash, milestoneCount });
    throw new Error('Contract integration pending. Ensure TypinkProvider is set up in main.tsx');
  } catch (error: any) {
    console.error('registerProject error:', error);
    throw new Error(error.message || 'Failed to register project');
  }
}

export async function submitDeliverable(
  projectId: string,
  milestoneId: number,
  deliverableHash: string,
  signer: Signer,
  client: any // dedot client
): Promise<string> {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    // Get contract instance from client
    // const contract = client.contract.ProjectRegistry(CONTRACT_ADDRESS);
    
    // Call contract method with signer
    // const result = await contract.tx.submitDeliverable(
    //   { signer },
    //   projectId,
    //   milestoneId,
    //   deliverableHash
    // );
    
    // TODO: Implement once dedot client is available in components
    console.log('submitDeliverable called:', { projectId, milestoneId, deliverableHash });
    throw new Error('Contract integration pending. Ensure TypinkProvider is set up in main.tsx');
  } catch (error: any) {
    console.error('submitDeliverable error:', error);
    throw new Error(error.message || 'Failed to submit deliverable');
  }
}

export async function markApproved(
  projectId: string,
  milestoneId: number,
  signer: Signer,
  client: any // dedot client
): Promise<string> {
  // CRITICAL: This must be called BEFORE releasing funds on Stellar
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    // Get contract instance from client
    // const contract = client.contract.ProjectRegistry(CONTRACT_ADDRESS);
    
    // Call contract method with signer
    // const result = await contract.tx.markApproved(
    //   { signer },
    //   projectId,
    //   milestoneId
    // );
    
    // TODO: Implement once dedot client is available in components
    console.log('markApproved called:', { projectId, milestoneId });
    throw new Error('Contract integration pending. Ensure TypinkProvider is set up in main.tsx');
  } catch (error: any) {
    console.error('markApproved error:', error);
    throw new Error(error.message || 'Failed to mark milestone as approved');
  }
}

// =============================================================================
// READ OPERATIONS (Query)
// =============================================================================

export async function getProjectMetadata(
  projectId: string,
  client: any // dedot client
): Promise<PolkadotProject | null> {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    // Get contract instance from client
    // const contract = client.contract.ProjectRegistry(CONTRACT_ADDRESS);
    
    // Query contract state
    // const result = await contract.query.getProject(projectId);
    
    // TODO: Implement once dedot client is available in components
    console.log('getProjectMetadata called:', { projectId });
    return null;
  } catch (error: any) {
    console.error('getProjectMetadata error:', error);
    return null;
  }
}

export async function getDeliverable(
  projectId: string,
  milestoneId: number,
  client: any // dedot client
): Promise<DeliverableRecord | null> {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    // Get contract instance from client
    // const contract = client.contract.ProjectRegistry(CONTRACT_ADDRESS);
    
    // Query contract state
    // const result = await contract.query.getDeliverable(projectId, milestoneId);
    
    // TODO: Implement once dedot client is available in components
    console.log('getDeliverable called:', { projectId, milestoneId });
    return null;
  } catch (error: any) {
    console.error('getDeliverable error:', error);
    return null;
  }
}

export async function getMilestoneStatus(
  projectId: string,
  milestoneId: number,
  client: any // dedot client
): Promise<{ submitted: boolean; approved: boolean; deliverableHash?: string }> {
  try {
    const deliverable = await getDeliverable(projectId, milestoneId, client);
    
    if (!deliverable) {
      return { submitted: false, approved: false };
    }

    return {
      submitted: !!deliverable.deliverableHash,
      approved: deliverable.approved,
      deliverableHash: deliverable.deliverableHash,
    };
  } catch (error: any) {
    console.error('getMilestoneStatus error:', error);
    return { submitted: false, approved: false };
  }
}
