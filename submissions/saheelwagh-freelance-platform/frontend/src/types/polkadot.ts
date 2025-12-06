// =============================================================================
// POLKADOT TYPE DEFINITIONS
// =============================================================================
// Types for Polkadot contract interactions
// These are separate from Stellar types to maintain isolation

// Project metadata stored on Polkadot
export interface PolkadotProject {
  projectId: string;
  title: string;
  description: string;
  client: string; // Polkadot address
  freelancer: string; // Polkadot address
  budget: string; // In smallest unit
  deadline: number; // Unix timestamp
  milestoneCount: number;
  status: ProjectStatus;
  createdAt: number;
}

export type ProjectStatus = 
  | 'Created'
  | 'InProgress'
  | 'Completed'
  | 'Disputed'
  | 'Cancelled';

// Deliverable record
export interface Deliverable {
  id: number;
  projectId: string;
  milestoneId: number;
  deliverableHash: string; // IPFS hash or description hash
  submittedAt: number;
  approved: boolean;
  approvedAt?: number;
  feedback?: string;
}

// Milestone status
export interface MilestoneStatus {
  milestoneId: number;
  submitted: boolean;
  approved: boolean;
  deliverableHash?: string;
  submittedAt?: number;
  approvedAt?: number;
}

// Form data for creating a project
export interface CreateProjectForm {
  title: string;
  description: string;
  freelancerAddress: string;
  budget: string;
  deadline: Date;
  milestoneCount: number;
}

// Form data for submitting a deliverable
export interface SubmitDeliverableForm {
  projectId: string;
  milestoneId: number;
  deliverableDescription: string;
  deliverableLink?: string;
}

// Contract interaction result
export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}

// Polkadot wallet state (from typeink)
export interface PolkadotWalletState {
  isConnected: boolean;
  address: string | null;
  walletName: string | null;
  balance: string | null;
}

// Contract addresses configuration
export interface PolkadotContractConfig {
  projectRegistry: string;
  milestoneManager?: string;
}

// Transaction status
export type TxStatus = 
  | 'idle'
  | 'signing'
  | 'broadcasting'
  | 'confirming'
  | 'success'
  | 'error';

// Transaction state
export interface TxState {
  status: TxStatus;
  txHash?: string;
  error?: string;
  blockNumber?: number;
}
