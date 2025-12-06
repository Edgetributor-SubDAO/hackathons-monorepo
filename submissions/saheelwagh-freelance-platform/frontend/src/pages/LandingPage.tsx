import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Clock,
  Users
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-pink-600/20" />
        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FreelanceEscrow</span>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Secure Freelance Payments
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">
              Powered by Blockchain
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Milestone-based escrow for freelancers and clients. Funds are locked until work is approved, 
            protecting both parties with smart contract security.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-lg"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center space-x-2 text-gray-300 hover:text-white px-8 py-3 rounded-lg font-medium transition-colors text-lg"
            >
              <span>Learn More</span>
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure Escrow</h3>
              <p className="text-gray-400">
                Funds are locked in a smart contract until milestones are completed and approved.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Milestone Payments</h3>
              <p className="text-gray-400">
                Break projects into milestones. Pay only for completed and approved work.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Trust Both Ways</h3>
              <p className="text-gray-400">
                Clients know funds are safe. Freelancers know payment is guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Create Project', desc: 'Client creates a project with milestones and budget' },
              { step: '2', title: 'Fund Escrow', desc: 'Client funds each milestone into the smart contract' },
              { step: '3', title: 'Complete Work', desc: 'Freelancer completes and submits milestone work' },
              { step: '4', title: 'Release Payment', desc: 'Client approves and funds are released instantly' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Powered by Two Chains</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Combining the best of Stellar and Polkadot for a secure, fast, and transparent experience.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Stellar (Soroban)</h3>
              </div>
              <ul className="space-y-3">
                {['Escrow smart contracts', 'Fast & cheap transactions', 'USDC payments', 'Testnet deployed'].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-900 border border-pink-500/30 rounded-xl p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Polkadot (Ink!)</h3>
              </div>
              <ul className="space-y-3">
                {['Project metadata registry', 'Dispute resolution', 'Reputation system', 'Coming soon'].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Connect your Stellar wallet and create your first project.</p>
          <Link
            to="/app"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-lg"
          >
            <span>Launch App</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>Built for the Stellar x Polkadot Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
