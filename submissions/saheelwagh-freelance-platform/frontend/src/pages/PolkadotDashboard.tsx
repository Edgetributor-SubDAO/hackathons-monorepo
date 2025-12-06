// =============================================================================
// POLKADOT DASHBOARD - Showcasing Polkadot's Role in PolkStellar
// =============================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderPlus, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ArrowLeft,
  Database,
  Shield,
  Zap,
  GitBranch,
  FileText,
  Users,
  Lock,
  ArrowRight,
  Layers,
  Code,
} from 'lucide-react';
import { useTypink } from 'typink';
import { usePolkadotContracts } from '../hooks/usePolkadotContracts';
import { PolkadotWallet } from '../components/PolkadotWallet';
import type { PolkadotProject } from '../types/polkadot';

export function PolkadotDashboard() {
  // Get wallet state directly from useTypink for reactivity
  const { connectedAccount, connectedWalletIds, network, wallets } = useTypink();
  
  // Derive connection state directly for proper reactivity
  const isPolkadotConnected = connectedWalletIds.length > 0 && !!connectedAccount;
  const walletAddress = connectedAccount?.address || null;
  
  // Debug logging - runs on every state change
  useEffect(() => {
    console.log('=== POLKADOT CONNECTION DEBUG ===');
    console.log('connectedWalletIds:', connectedWalletIds);
    console.log('connectedAccount:', connectedAccount);
    console.log('connectedAccount?.address:', connectedAccount?.address);
    console.log('network:', network);
    console.log('wallets:', wallets.map(w => ({ id: w.id, name: w.name, installed: w.installed })));
    console.log('isPolkadotConnected:', isPolkadotConnected);
    console.log('walletAddress:', walletAddress);
    console.log('================================');
  }, [connectedWalletIds, connectedAccount, network, wallets, isPolkadotConnected, walletAddress]);
  
  const { getMyProjects } = usePolkadotContracts();

  const [projects, setProjects] = useState<PolkadotProject[]>([]);

  // Load projects on mount and when wallet connects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const myProjects = await getMyProjects();
        setProjects(myProjects);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    loadProjects();
  }, [getMyProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-blue-100 text-blue-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Light Theme Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/app" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Stellar</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Polkadot</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Show connected address */}
              {isPolkadotConnected && walletAddress && (
                <div className="hidden sm:flex items-center space-x-2 bg-purple-100 px-3 py-1.5 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-purple-700 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              )}
              <PolkadotWallet />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - What is Polkadot's Role */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Layers className="w-4 h-4" />
            <span>Powered by Ink! Smart Contracts</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Project Metadata & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Workflow Management</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Polkadot handles all non-financial data in PolkStellar — project details, deliverables, 
            milestone tracking, and dispute resolution — while Stellar manages the money.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Dual-Chain Architecture</h2>
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Stellar Side */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stellar (Soroban)</h3>
              <p className="text-gray-600 text-sm mb-4">Financial Layer</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-gray-700">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span>Escrow funds</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-700">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Fast payments</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-700">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Fund security</span>
                </li>
              </ul>
            </div>

            {/* Connection Arrow */}
            <div className="flex flex-col items-center justify-center">
              <div className="hidden md:flex items-center space-x-2 text-purple-500">
                <ArrowRight className="w-8 h-8" />
                <ArrowLeft className="w-8 h-8" />
              </div>
              <div className="md:hidden flex items-center space-x-2 text-purple-500 rotate-90">
                <ArrowRight className="w-8 h-8" />
                <ArrowLeft className="w-8 h-8" />
              </div>
              <p className="text-sm text-purple-600 font-medium mt-2 text-center">Linked by<br/>Project ID</p>
            </div>

            {/* Polkadot Side */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-300 ring-2 ring-purple-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Polkadot (Ink!)</h3>
              <p className="text-gray-600 text-sm mb-4">Data & Workflow Layer</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-gray-700">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span>Project metadata</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-700">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>Deliverables</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-700">
                  <GitBranch className="w-4 h-4 text-purple-500" />
                  <span>Milestone tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* What Polkadot Stores */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Polkadot Stores</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <FolderPlus className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Project Details</h3>
              <p className="text-gray-600 text-sm">Title, description, client/freelancer addresses, deadlines, and milestone counts</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Deliverables</h3>
              <p className="text-gray-600 text-sm">IPFS hashes of submitted work, timestamps, and approval status</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Milestone Status</h3>
              <p className="text-gray-600 text-sm">Track progress: Created → In Progress → Submitted → Approved</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Dispute Resolution</h3>
              <p className="text-gray-600 text-sm">Evidence submission and arbitration workflow for conflicts</p>
            </div>
          </div>
        </div>

        {/* Smart Contract Info */}
        <div className="mb-12 bg-gray-900 rounded-2xl p-8 text-white">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Ink! Smart Contracts</h2>
              <p className="text-gray-400">Written in Rust, compiled to WebAssembly, deployed on Polkadot</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-3">FreelanceEscrowMetadata</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <code className="text-purple-300">register_project()</code> - Create new project</li>
                <li>• <code className="text-purple-300">submit_deliverable()</code> - Upload work</li>
                <li>• <code className="text-purple-300">approve_deliverable()</code> - Client approval</li>
                <li>• <code className="text-purple-300">get_project()</code> - Fetch project data</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-3">Key Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• On-chain project metadata storage</li>
                <li>• IPFS integration for deliverables</li>
                <li>• Event emissions for indexing</li>
                <li>• Role-based access control</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sample Projects Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sample Projects (Mock Data)</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Will be replaced with blockchain data</span>
          </div>
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div 
                key={project.projectId} 
                className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-purple-600">
                        <FileCheck className="w-4 h-4" />
                        <span className="font-medium">{project.milestoneCount} milestones</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Due {new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-green-600">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">{(parseInt(project.budget) / 1000000000000).toFixed(0)} DOT</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg">
                    <span className="font-medium">View</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works - Workflow */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center relative">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-gray-900 mb-2">Create Project</h3>
              <p className="text-gray-600 text-sm">Client registers project metadata on Polkadot</p>
              <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center relative">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-gray-900 mb-2">Fund Escrow</h3>
              <p className="text-gray-600 text-sm">Client deposits funds on Stellar escrow</p>
              <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center relative">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-gray-900 mb-2">Submit Work</h3>
              <p className="text-gray-600 text-sm">Freelancer uploads deliverables to Polkadot</p>
              <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">4</div>
              <h3 className="font-bold text-gray-900 mb-2">Release Payment</h3>
              <p className="text-gray-600 text-sm">Client approves, Stellar releases funds</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Connect your SubWallet to interact with the Polkadot smart contracts. 
            Create projects, submit deliverables, and track milestones on-chain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/app" 
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go to Stellar Dashboard</span>
            </Link>
            <a 
              href="https://docs.polkadot.network/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition-colors"
            >
              <span>Learn More About Polkadot</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-gray-500 text-sm text-center">Polkadot Dashboard - Project Metadata & Deliverables</p>
        </div>
      </footer>
    </div>
  );
}
