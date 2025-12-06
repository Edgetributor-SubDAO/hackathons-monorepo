// Mock data for development - will be replaced with blockchain data

export interface Milestone {
  id: number;
  title: string;
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'released';
  deliverableHash?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  freelancer: string;
  totalBudget: number;
  fundedAmount: number;
  releasedAmount: number;
  milestones: Milestone[];
  status: 'draft' | 'funded' | 'in_progress' | 'completed' | 'disputed';
  createdAt: string;
}

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    title: 'E-commerce Website Redesign',
    description: 'Complete redesign of the main e-commerce platform with modern UI/UX',
    client: 'GCLIENT...XYZ1',
    freelancer: 'GFREELANCER...ABC1',
    totalBudget: 5000,
    fundedAmount: 5000,
    releasedAmount: 1000,
    milestones: [
      { id: 1, title: 'Wireframes & Mockups', amount: 1000, status: 'released' },
      { id: 2, title: 'UI Design', amount: 2000, status: 'submitted', deliverableHash: 'ipfs://Qm123...' },
      { id: 3, title: 'Frontend Development', amount: 2000, status: 'pending' },
    ],
    status: 'in_progress',
    createdAt: '2024-12-01',
  },
  {
    id: 'proj-002',
    title: 'Mobile App MVP',
    description: 'Build a React Native MVP for a fitness tracking app',
    client: 'GCLIENT...XYZ2',
    freelancer: 'GFREELANCER...ABC1',
    totalBudget: 8000,
    fundedAmount: 8000,
    releasedAmount: 0,
    milestones: [
      { id: 1, title: 'App Architecture', amount: 1500, status: 'pending' },
      { id: 2, title: 'Core Features', amount: 4000, status: 'pending' },
      { id: 3, title: 'Testing & Polish', amount: 2500, status: 'pending' },
    ],
    status: 'funded',
    createdAt: '2024-12-03',
  },
];

export const mockFreelancerStats = {
  totalEarned: 15000,
  pendingRelease: 4000,
  activeProjects: 2,
  completedProjects: 8,
  reputation: 4.8,
};

export const mockClientStats = {
  totalSpent: 25000,
  activeProjects: 3,
  completedProjects: 12,
  inEscrow: 13000,
};
