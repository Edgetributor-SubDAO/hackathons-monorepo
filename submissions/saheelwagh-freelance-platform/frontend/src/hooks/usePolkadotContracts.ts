// =============================================================================
// POLKADOT CONTRACT INTERACTIONS HOOK
// =============================================================================
// This hook provides contract interaction functions using typeink
// It's completely separate from Stellar interactions

import { useState, useCallback } from 'react';
import { useTypink } from 'typink';
import type {
  PolkadotProject,
  Deliverable,
  MilestoneStatus,
  ContractResult,
  TxState,
  CreateProjectForm,
  SubmitDeliverableForm,
} from '../types/polkadot';

// Contract address from environment
const PROJECT_REGISTRY_ADDRESS = import.meta.env.VITE_POLKADOT_CONTRACT_ADDRESS || '';

export function usePolkadotContracts() {
  const { connectedAccount, signer } = useTypink();
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is connected
  const isWalletConnected = !!connectedAccount;
  const walletAddress = connectedAccount?.address || null;

  // Reset transaction state
  const resetTxState = useCallback(() => {
    setTxState({ status: 'idle' });
    setError(null);
  }, []);

  // ==========================================================================
  // WRITE OPERATIONS (Transactions)
  // ==========================================================================

  /**
   * Register a new project on Polkadot
   * This creates project metadata on-chain
   */
  const registerProject = useCallback(async (
    form: CreateProjectForm
  ): Promise<ContractResult<string>> => {
    if (!isWalletConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!PROJECT_REGISTRY_ADDRESS) {
      return { success: false, error: 'Contract address not configured' };
    }

    try {
      setIsLoading(true);
      setTxState({ status: 'signing' });
      setError(null);

      console.log('Registering project on Polkadot:', form);

      // Generate a unique project ID
      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Implement actual contract call when contract is deployed
      // For now, simulate the transaction
      setTxState({ status: 'broadcasting' });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTxState({ status: 'confirming' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      setTxState({ status: 'success', txHash: mockTxHash });

      console.log('Project registered successfully:', { projectId, txHash: mockTxHash });

      return {
        success: true,
        data: projectId,
        txHash: mockTxHash,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register project';
      setTxState({ status: 'error', error: errorMessage });
      setError(errorMessage);
      console.error('registerProject error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isWalletConnected, signer]);

  /**
   * Submit a deliverable for a milestone
   */
  const submitDeliverable = useCallback(async (
    form: SubmitDeliverableForm
  ): Promise<ContractResult<number>> => {
    if (!isWalletConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!PROJECT_REGISTRY_ADDRESS) {
      return { success: false, error: 'Contract address not configured' };
    }

    try {
      setIsLoading(true);
      setTxState({ status: 'signing' });
      setError(null);

      console.log('Submitting deliverable on Polkadot:', form);

      // Create deliverable hash from description
      const deliverableHash = `hash_${Date.now()}`;

      // TODO: Implement actual contract call when contract is deployed
      setTxState({ status: 'broadcasting' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTxState({ status: 'confirming' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      setTxState({ status: 'success', txHash: mockTxHash });

      console.log('Deliverable submitted successfully:', { deliverableHash, txHash: mockTxHash });

      return {
        success: true,
        data: form.milestoneId,
        txHash: mockTxHash,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit deliverable';
      setTxState({ status: 'error', error: errorMessage });
      setError(errorMessage);
      console.error('submitDeliverable error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isWalletConnected, signer]);

  /**
   * Approve a milestone deliverable
   * IMPORTANT: This should be called BEFORE releasing funds on Stellar
   */
  const approveDeliverable = useCallback(async (
    projectId: string,
    milestoneId: number
  ): Promise<ContractResult<boolean>> => {
    if (!isWalletConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!PROJECT_REGISTRY_ADDRESS) {
      return { success: false, error: 'Contract address not configured' };
    }

    try {
      setIsLoading(true);
      setTxState({ status: 'signing' });
      setError(null);

      console.log('Approving deliverable on Polkadot:', { projectId, milestoneId });

      // TODO: Implement actual contract call when contract is deployed
      setTxState({ status: 'broadcasting' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTxState({ status: 'confirming' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      setTxState({ status: 'success', txHash: mockTxHash });

      console.log('Deliverable approved successfully:', { projectId, milestoneId, txHash: mockTxHash });

      return {
        success: true,
        data: true,
        txHash: mockTxHash,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve deliverable';
      setTxState({ status: 'error', error: errorMessage });
      setError(errorMessage);
      console.error('approveDeliverable error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isWalletConnected, signer]);

  // ==========================================================================
  // READ OPERATIONS (Queries)
  // ==========================================================================

  /**
   * Get project metadata from Polkadot
   */
  const getProject = useCallback(async (
    projectId: string
  ): Promise<PolkadotProject | null> => {
    if (!PROJECT_REGISTRY_ADDRESS) {
      console.warn('Contract address not configured');
      return null;
    }

    try {
      console.log('Fetching project from Polkadot:', projectId);

      // TODO: Implement actual contract query when contract is deployed
      // For now, return mock data
      const mockProject: PolkadotProject = {
        projectId,
        title: 'Sample Polkadot Project',
        description: 'This is a sample project stored on Polkadot',
        client: walletAddress || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        freelancer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        budget: '1000000000000', // 1 DOT in planck
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        milestoneCount: 3,
        status: 'InProgress',
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      };

      return mockProject;
    } catch (err) {
      console.error('getProject error:', err);
      return null;
    }
  }, [walletAddress]);

  /**
   * Get deliverable details
   */
  const getDeliverable = useCallback(async (
    projectId: string,
    milestoneId: number
  ): Promise<Deliverable | null> => {
    if (!PROJECT_REGISTRY_ADDRESS) {
      console.warn('Contract address not configured');
      return null;
    }

    try {
      console.log('Fetching deliverable from Polkadot:', { projectId, milestoneId });

      // TODO: Implement actual contract query when contract is deployed
      // For now, return mock data for milestone 1
      if (milestoneId === 1) {
        const mockDeliverable: Deliverable = {
          id: 1,
          projectId,
          milestoneId,
          deliverableHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
          submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          approved: true,
          approvedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        };
        return mockDeliverable;
      }

      return null;
    } catch (err) {
      console.error('getDeliverable error:', err);
      return null;
    }
  }, []);

  /**
   * Get milestone status
   */
  const getMilestoneStatus = useCallback(async (
    projectId: string,
    milestoneId: number
  ): Promise<MilestoneStatus> => {
    try {
      const deliverable = await getDeliverable(projectId, milestoneId);

      if (!deliverable) {
        return {
          milestoneId,
          submitted: false,
          approved: false,
        };
      }

      return {
        milestoneId,
        submitted: true,
        approved: deliverable.approved,
        deliverableHash: deliverable.deliverableHash,
        submittedAt: deliverable.submittedAt,
        approvedAt: deliverable.approvedAt,
      };
    } catch (err) {
      console.error('getMilestoneStatus error:', err);
      return {
        milestoneId,
        submitted: false,
        approved: false,
      };
    }
  }, [getDeliverable]);

  /**
   * Get all projects for the connected wallet
   */
  const getMyProjects = useCallback(async (): Promise<PolkadotProject[]> => {
    if (!walletAddress) {
      return [];
    }

    try {
      console.log('Fetching projects for wallet:', walletAddress);

      // TODO: Implement actual contract query when contract is deployed
      // For now, return realistic mock data
      const mockProjects: PolkadotProject[] = [
        {
          projectId: 'proj_001',
          title: 'Build DeFi Dashboard',
          description: 'Create a comprehensive DeFi analytics dashboard with real-time data feeds, portfolio tracking, and yield farming opportunities. Must support multiple chains and have a clean, intuitive UI.',
          client: walletAddress,
          freelancer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          budget: '5000000000000', // 5 DOT
          deadline: Date.now() + 21 * 24 * 60 * 60 * 1000, // 21 days
          milestoneCount: 4,
          status: 'InProgress',
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        },
        {
          projectId: 'proj_002',
          title: 'Smart Contract Audit',
          description: 'Full security audit of Ink! smart contracts including code review, vulnerability assessment, and optimization recommendations. Deliverables include detailed report and recommendations.',
          client: walletAddress,
          freelancer: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
          budget: '8000000000000', // 8 DOT
          deadline: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
          milestoneCount: 3,
          status: 'InProgress',
          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        },
        {
          projectId: 'proj_003',
          title: 'Mobile Wallet Integration',
          description: 'Integrate Polkadot wallet functionality into existing mobile app. Support for account creation, transaction signing, and balance queries.',
          client: walletAddress,
          freelancer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          budget: '3000000000000', // 3 DOT
          deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          milestoneCount: 2,
          status: 'Completed',
          createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
        },
        {
          projectId: 'proj_004',
          title: 'API Documentation',
          description: 'Write comprehensive API documentation for Polkadot integration library with code examples, tutorials, and troubleshooting guides.',
          client: walletAddress,
          freelancer: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBQy6PfEbuR61uCJ7ilm',
          budget: '2000000000000', // 2 DOT
          deadline: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days
          milestoneCount: 2,
          status: 'Created',
          createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        },
      ];

      return mockProjects;
    } catch (err) {
      console.error('getMyProjects error:', err);
      return [];
    }
  }, [walletAddress]);

  return {
    // State
    isWalletConnected,
    walletAddress,
    isLoading,
    error,
    txState,
    contractAddress: PROJECT_REGISTRY_ADDRESS,

    // Actions
    resetTxState,

    // Write operations
    registerProject,
    submitDeliverable,
    approveDeliverable,

    // Read operations
    getProject,
    getDeliverable,
    getMilestoneStatus,
    getMyProjects,
  };
}
