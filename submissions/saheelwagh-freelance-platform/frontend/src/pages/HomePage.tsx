import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Lock,
  FileCheck
} from 'lucide-react';

// =============================================================================
// BLOCKCHAIN CONNECTION POINTS:
// This page is mostly static, but could show:
// - Total value locked (TVL) from Stellar escrow contract
// - Number of projects created (from contract storage)
// - Recent transactions feed
// =============================================================================

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-flex items-center space-x-2 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm text-gray-300">Live on Testnet</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Trustless Freelancing.
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
            Instant Payments.
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          No more waiting 30 days for payment. No more 20% platform fees. 
          Just secure escrow and instant releases powered by blockchain.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/client"
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <span>I'm a Client</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/freelancer"
            className="inline-flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-gray-700"
          >
            <span>I'm a Freelancer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: '1',
              icon: FileCheck,
              title: 'Create Project',
              description: 'Client defines milestones and budget',
            },
            {
              step: '2',
              icon: Lock,
              title: 'Fund Escrow',
              description: 'USDC locked in smart contract',
            },
            {
              step: '3',
              icon: CheckCircle2,
              title: 'Deliver & Approve',
              description: 'Freelancer submits, client approves',
            },
            {
              step: '4',
              icon: Zap,
              title: 'Instant Payment',
              description: 'Funds released in seconds',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                {item.step}
              </div>
              <item.icon className="w-10 h-10 text-blue-500 mx-auto mb-4 mt-2" />
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chain Architecture - IMPORTANT: Shows which chain does what */}
      <section className="py-12 bg-gray-900/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Powered by Two Chains
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Each blockchain handles what it does best. Together, they create a complete trustless system.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Stellar Card */}
          <div className="bg-gray-950 border border-blue-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Stellar (Soroban)</h3>
                  <p className="text-blue-400 text-sm">The Money Layer</p>
                </div>
              </div>
              
              <ul className="space-y-3">
                {[
                  'Escrow smart contract',
                  'USDC deposits & releases',
                  'Milestone-based payments',
                  'Instant fund transfers',
                  'Low transaction fees (~$0.00001)',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-500">
                  <span className="text-blue-400 font-medium">Contract Functions:</span> create_project, fund_project, release_milestone, refund
                </p>
              </div>
            </div>
          </div>

          {/* Polkadot Card */}
          <div className="bg-gray-950 border border-pink-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Polkadot (Ink!)</h3>
                  <p className="text-pink-400 text-sm">The Verification Layer</p>
                </div>
              </div>
              
              <ul className="space-y-3">
                {[
                  'Project registry & metadata',
                  'Deliverable hash storage',
                  'Work submission proofs',
                  'Dispute evidence records',
                  'Immutable audit trail',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-500">
                  <span className="text-pink-400 font-medium">Contract Functions:</span> register_project, submit_deliverable, mark_approved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-chain flow */}
        <div className="mt-8 max-w-2xl mx-auto bg-gray-950 border border-gray-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 text-center">Cross-Chain Flow</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-400">Fund on<br/><span className="text-blue-400">Stellar</span></p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-600" />
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                <FileCheck className="w-6 h-6 text-pink-500" />
              </div>
              <p className="text-gray-400">Submit on<br/><span className="text-pink-400">Polkadot</span></p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-600" />
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6 text-pink-500" />
              </div>
              <p className="text-gray-400">Approve on<br/><span className="text-pink-400">Polkadot</span></p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-600" />
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-400">Release on<br/><span className="text-blue-400">Stellar</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why GigVault?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Clock,
              title: '5 Seconds, Not 30 Days',
              description: 'Funds release instantly when work is approved. No more waiting for payment processing.',
              stat: '5s',
              statLabel: 'avg. release time',
            },
            {
              icon: DollarSign,
              title: 'Zero Platform Fees',
              description: 'Only pay network transaction fees (~$0.00001). Keep 100% of what you earn.',
              stat: '0%',
              statLabel: 'platform fee',
            },
            {
              icon: Shield,
              title: 'Trustless Security',
              description: 'Smart contracts hold funds. Neither party can cheat. Code is law.',
              stat: '100%',
              statLabel: 'on-chain',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              <item.icon className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 mb-4">{item.description}</p>
              <div className="pt-4 border-t border-gray-800">
                <span className="text-3xl font-bold text-white">{item.stat}</span>
                <span className="text-gray-500 text-sm ml-2">{item.statLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-pink-600/20 border border-gray-800 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Connect your wallet and create your first project in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/client"
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <span>Create a Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/freelancer"
              className="inline-flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors border border-gray-700"
            >
              <span>Find Work</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
