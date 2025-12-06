import { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  History,
  X
} from 'lucide-react';
import { cn, truncateAddress, formatStroops } from '../lib/utils';
import { useWallet } from '../context/WalletContext';
import { getProject, getProjectCount, submitMilestone as submitMilestoneToChain } from '../lib/escrow-client';
import { getAllProjectMetadata, type ProjectMetadata } from '../lib/project-metadata';
import {
  addTransaction,
  getRecentTransactions,
  getStellarExplorerUrl,
  getTransactionTypeName,
  getTransactionTypeIcon,
  formatTransactionTime,
  type Transaction
} from '../lib/transaction-history';

// =============================================================================
// BLOCKCHAIN CONNECTION POINTS:
// 
// STELLAR (Soroban) - All operations:
// - getProjectsForFreelancer(): Query escrow contract for assigned projects
// - getEarnings(): Calculate total released funds
// - submitMilestone(): Mark milestone as submitted (work done)
//
// Wallet: Freighter (Stellar) - same wallet for both client and freelancer
// =============================================================================

// Type for on-chain project data
interface OnChainProject {
  id: number;
  client: string;
  freelancer: string;
  milestones: Array<{
    amount: bigint | number;
    status: any;
  }>;
  total_funded: bigint | number;
  total_released: bigint | number;
}

// Helper to extract status tag from various formats
// Status can be: "Pending", {Pending: null}, {tag: "Pending"}, or Array like ["Pending"] or [0]
const STATUS_MAP: Record<number, string> = {
  0: 'Pending',
  1: 'Funded',
  2: 'Submitted',
  3: 'Approved',
  4: 'Released',
};

function getStatusTag(status: any): string {
  if (!status) return 'Unknown';
  if (typeof status === 'string') return status;
  
  // Handle array format like [0] or ["Pending"]
  if (Array.isArray(status)) {
    const val = status[0];
    if (typeof val === 'number') return STATUS_MAP[val] || 'Unknown';
    if (typeof val === 'string') return val;
    // Could be nested object
    if (val && typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length > 0) return keys[0];
    }
    return 'Unknown';
  }
  
  // Handle {tag: "Pending"} format
  if (status.tag) return status.tag;
  
  // Handle {Pending: null}, {Funded: null} format
  const keys = Object.keys(status);
  if (keys.length > 0) return keys[0];
  
  return 'Unknown';
}

// Helper to calculate total budget from milestones
function getTotalBudget(milestones: Array<{amount: bigint | number}>): number {
  if (!milestones) return 0;
  return milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
}

// Project status type for filtering
type ProjectStatus = 'all' | 'pending' | 'active' | 'completed';

export function FreelancerDashboard() {
  // On-chain projects
  const [onChainProjects, setOnChainProjects] = useState<OnChainProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>('all');
  const [showTxHistory, setShowTxHistory] = useState(false);
  
  // Transaction history from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Project metadata from localStorage
  const [projectMetadata, setProjectMetadata] = useState<Record<number, ProjectMetadata>>({});

  // Use shared wallet context
  const { isConnected, address } = useWallet();

  // Load on-chain projects
  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const count = await getProjectCount();
      console.log('Freelancer - Project count:', count);
      
      const projects: OnChainProject[] = [];
      for (let i = 1; i <= count; i++) {
        const project = await getProject(i);
        if (project) {
          // Filter to show only projects where current user is freelancer
          // For now, show all projects (demo mode)
          projects.push({ ...project, id: i });
        }
      }
      setOnChainProjects(projects);
      console.log('Freelancer - Loaded projects:', projects);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load projects on mount and when wallet connects
  useEffect(() => {
    if (isConnected) {
      loadProjects();
    }
  }, [isConnected]);

  // Load project metadata and transaction history from localStorage
  useEffect(() => {
    setProjectMetadata(getAllProjectMetadata());
    setTransactions(getRecentTransactions(20));
  }, []);

  // Refresh transaction history after any transaction
  const refreshTransactionHistory = () => {
    setTransactions(getRecentTransactions(20));
  };

  // Get project status for filtering
  const getProjectStatus = (project: OnChainProject): ProjectStatus => {
    if (!project.milestones || project.milestones.length === 0) return 'pending';
    const allReleased = project.milestones.every(m => getStatusTag(m.status) === 'Released');
    if (allReleased) return 'completed';
    const anyFunded = project.milestones.some(m => 
      ['Funded', 'Submitted', 'Approved'].includes(getStatusTag(m.status))
    );
    return anyFunded ? 'active' : 'pending';
  };

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    const filtered = onChainProjects.filter(project => {
      // Status filter
      if (statusFilter !== 'all' && getProjectStatus(project) !== statusFilter) {
        return false;
      }
      
      // Search filter (by title, client address, or project ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const metadata = projectMetadata[project.id];
        const title = metadata?.title?.toLowerCase() || '';
        const description = metadata?.description?.toLowerCase() || '';
        const client = project.client?.toLowerCase() || '';
        const idMatch = project.id.toString().includes(query);
        
        if (!title.includes(query) && !description.includes(query) && 
            !client.includes(query) && !idMatch) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort in reverse order (newest first)
    return filtered.sort((a, b) => b.id - a.id);
  }, [onChainProjects, statusFilter, searchQuery, projectMetadata]);

  // Handle submitting a milestone on-chain
  const handleSubmitMilestoneOnChain = async (projectId: number, milestoneIndex: number) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setTxStatus('Submitting milestone...');
    try {
      const result = await submitMilestoneToChain(address, projectId, milestoneIndex);
      
      if (result.success) {
        // Add to transaction history
        const project = onChainProjects.find(p => p.id === projectId);
        addTransaction({
          hash: result.txHash || '',
          type: 'submit_milestone',
          status: 'success',
          projectId,
          milestoneIndex,
          fromAddress: address,
          toAddress: project?.client,
        });
        refreshTransactionHistory();
        
        setTxStatus('✅ Milestone submitted successfully!');
        loadProjects(); // Reload to see updated status
        setTimeout(() => setTxStatus(null), 3000);
      } else {
        setTxStatus(`❌ Error: ${result.error}`);
      }
    } catch (err: any) {
      setTxStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleWithdraw = () => {
    // =============================================================================
    // BLOCKCHAIN CONNECTION POINT - WITHDRAW:
    //
    // Released funds are already in the freelancer's Stellar wallet
    // This button could trigger a transfer to an external account
    // or just show the current balance
    //
    // const balance = await stellarContract.getBalance(freelancerAddress);
    // =============================================================================
    console.log('Withdraw funds');
  };

  // Calculate stats from on-chain projects
  const stats = {
    totalProjects: onChainProjects.length,
    totalEarned: onChainProjects.reduce((sum, p) => sum + Number(p.total_released || 0), 0),
    totalPending: onChainProjects.reduce((sum, p) => {
      const budget = getTotalBudget(p.milestones);
      return sum + (budget - Number(p.total_released || 0));
    }, 0),
    submittedMilestones: onChainProjects.reduce((sum, p) => {
      return sum + (p.milestones?.filter(m => getStatusTag(m.status) === 'Submitted').length || 0);
    }, 0),
  };

  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Freelancer Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your projects and earnings</p>
        </div>
        <button
          onClick={handleWithdraw}
          className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          <span>Withdraw Funds</span>
        </button>
      </div>

      {/* Wallet Warning */}
      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Wallet not connected</p>
            <p className="text-yellow-400/70 text-sm">
              Connect your Freighter wallet to submit work and receive payments.
            </p>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {txStatus && (
        <div className={cn(
          "p-4 rounded-lg",
          txStatus.startsWith('✅') ? "bg-green-500/10 border border-green-500/30" :
          txStatus.startsWith('❌') ? "bg-red-500/10 border border-red-500/30" :
          "bg-blue-500/10 border border-blue-500/30"
        )}>
          <p className="text-white">{txStatus}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: isConnected ? `${stats.totalEarned} stroops` : '--', icon: DollarSign, color: 'text-green-500' },
          { label: 'Pending Release', value: isConnected ? `${stats.totalPending} stroops` : '--', icon: Clock, color: 'text-yellow-500' },
          { label: 'Active Projects', value: isConnected ? String(stats.totalProjects) : '--', icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Awaiting Approval', value: isConnected ? String(stats.submittedMilestones) : '--', icon: CheckCircle2, color: 'text-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <stat.icon className={cn('w-4 h-4', stat.color)} />
              <span className="text-gray-400 text-sm">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search, Filter & Transaction History */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or address..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
          >
            <option value="all">All Projects</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        {/* Transaction History Toggle */}
        <button
          onClick={() => setShowTxHistory(!showTxHistory)}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
            showTxHistory 
              ? "bg-green-600 text-white" 
              : "bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-700"
          )}
        >
          <History className="w-4 h-4" />
          <span>History</span>
          {transactions.length > 0 && (
            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {transactions.length}
            </span>
          )}
        </button>
      </div>

      {/* Transaction History Panel */}
      {showTxHistory && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Transaction History</h3>
            <button
              onClick={() => setShowTxHistory(false)}
              className="text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getTransactionTypeIcon(tx.type)}</span>
                    <div>
                      <p className="text-white font-medium">
                        {getTransactionTypeName(tx.type)}
                        {tx.projectId && <span className="text-gray-400"> #{tx.projectId}</span>}
                        {tx.milestoneIndex !== undefined && (
                          <span className="text-gray-500"> (M{tx.milestoneIndex + 1})</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatTransactionTime(tx.timestamp)}
                        {tx.amount && ` • ${formatStroops(tx.amount)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      tx.status === 'success' && "bg-green-500/20 text-green-400",
                      tx.status === 'pending' && "bg-yellow-500/20 text-yellow-400",
                      tx.status === 'error' && "bg-red-500/20 text-red-400"
                    )}>
                      {tx.status}
                    </span>
                    {tx.hash && (
                      <a
                        href={getStellarExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300"
                        title="View on Stellar Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* On-Chain Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            On-Chain Projects
            {searchQuery || statusFilter !== 'all' ? (
              <span className="text-gray-500 text-sm font-normal ml-2">
                ({filteredProjects.length} of {onChainProjects.length})
              </span>
            ) : null}
          </h2>
          <button
            onClick={loadProjects}
            disabled={loadingProjects}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loadingProjects && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
        
        {loadingProjects && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-800 rounded"></div>
                      <div className="h-3 w-48 bg-gray-800 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-gray-800 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="h-4 w-24 bg-gray-800 rounded"></div>
                  <div className="h-4 w-24 bg-gray-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loadingProjects && isConnected && onChainProjects.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No on-chain projects yet.</p>
            <p className="text-gray-500 text-sm mt-1">Projects assigned to you will appear here.</p>
          </div>
        )}

        {/* No results after filtering */}
        {!loadingProjects && isConnected && onChainProjects.length > 0 && filteredProjects.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No projects match your search</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
        
        {!loadingProjects && filteredProjects.map((project) => {
          const totalBudget = getTotalBudget(project.milestones);
          const metadata = projectMetadata[project.id];
          const projectStatus = getProjectStatus(project);
          return (
            <div
              key={project.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold">#{project.id}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {metadata?.title || `Escrow Project #${project.id}`}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      Budget: {formatStroops(totalBudget)} • Client: {truncateAddress(project.client)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border",
                    projectStatus === 'pending' && "bg-gray-500/20 text-gray-400 border-gray-500/30",
                    projectStatus === 'active' && "bg-green-500/20 text-green-400 border-green-500/30",
                    projectStatus === 'completed' && "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  )}>
                    {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Project Description (if available) */}
              {metadata?.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{metadata.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Your Earnings:</span>
                  <p className="text-green-400 font-medium">{formatStroops(Number(project.total_released || 0))}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pending:</span>
                  <p className="text-yellow-400 font-medium">{formatStroops(totalBudget - Number(project.total_released || 0))}</p>
                </div>
              </div>
              
              {project.milestones && project.milestones.length > 0 && (
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-gray-500 text-sm mb-2">Milestones:</p>
                  <div className="space-y-2">
                    {project.milestones.map((m, idx) => {
                      const statusTag = getStatusTag(m.status);
                      return (
                        <div key={idx} className="bg-gray-800/50 rounded-lg px-3 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300 font-medium">Milestone {idx + 1}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 text-sm">{String(m.amount)} stroops</span>
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                statusTag === 'Pending' && 'bg-gray-500/20 text-gray-400',
                                statusTag === 'Funded' && 'bg-blue-500/20 text-blue-400',
                                statusTag === 'Submitted' && 'bg-yellow-500/20 text-yellow-400',
                                statusTag === 'Approved' && 'bg-green-500/20 text-green-400',
                                statusTag === 'Released' && 'bg-purple-500/20 text-purple-400',
                              )}>
                                {statusTag}
                              </span>
                            </div>
                          </div>
                          {/* Action buttons based on status */}
                          <div className="flex items-center space-x-2 mt-2">
                            {statusTag === 'Pending' && (
                              <span className="text-xs text-gray-400">⏳ Waiting for client to fund...</span>
                            )}
                            {statusTag === 'Funded' && (
                              <button
                                onClick={() => handleSubmitMilestoneOnChain(project.id, idx)}
                                disabled={txStatus !== null}
                                className="flex-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white text-xs rounded transition-colors"
                              >
                                📤 Submit Work (Mark as Done)
                              </button>
                            )}
                            {statusTag === 'Submitted' && (
                              <span className="text-xs text-yellow-400">⏳ Waiting for client approval...</span>
                            )}
                            {statusTag === 'Released' && (
                              <span className="text-xs text-green-400">✓ Payment received!</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>


    </div>
  );
}
