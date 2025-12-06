'use client';

import { Modal } from '@/components/ui/modal';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { CheckCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    hash: string;
    amount: string;
    currency: string;
    serviceId: string;
    status: 'success' | 'failed' | 'pending';
    date: Date;
    memo?: string;
    stellarHash?: string;
    polkadotHash?: string;
  };
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
            <StatusBadge
              status={
                transaction.status === 'success'
                  ? 'success'
                  : transaction.status === 'failed'
                    ? 'error'
                    : 'warning'
              }
            >
              {transaction.status}
            </StatusBadge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Payment Information */}
          <GlassCard glow="blue">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">
                  {transaction.amount} {transaction.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Service:</span>
                <span className="text-white">{transaction.serviceId}</span>
              </div>
              {transaction.memo && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Memo:</span>
                  <code className="text-gray-300 font-mono text-sm">{transaction.memo}</code>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Date:</span>
                <span className="text-white text-sm">
                  {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Blockchain Information */}
          <GlassCard glow="purple">
            <h3 className="text-lg font-semibold text-white mb-4">Blockchain Information</h3>
            <div className="space-y-3">
              {transaction.stellarHash && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-sm">Stellar Hash:</span>
                    <button
                      onClick={() => copyToClipboard(transaction.stellarHash!)}
                      className="text-electric-blue hover:text-electric-purple text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-gray-300 font-mono text-xs break-all block">
                    {transaction.stellarHash}
                  </code>
                </div>
              )}
              {transaction.polkadotHash && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-sm">Polkadot Hash:</span>
                    <button
                      onClick={() => copyToClipboard(transaction.polkadotHash!)}
                      className="text-electric-blue hover:text-electric-purple text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-gray-300 font-mono text-xs break-all block">
                    {transaction.polkadotHash}
                  </code>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Timeline */}
        <GlassCard glow="blue" className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction Timeline</h3>
          <div className="space-y-4">
            {['Initiated', 'Processing', 'Confirmed', 'Access Granted'].map((step, index) => {
              const isCompleted = index <= 2; // Adjust based on actual status
              return (
                <div key={index} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isCompleted
                        ? 'glass-lg text-white shadow-glow-green'
                        : 'glass text-gray-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span>{index + 1}</span>}
                  </div>
                  <span className={isCompleted ? 'text-white' : 'text-gray-400'}>{step}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {transaction.stellarHash && (
            <a
              href={`https://stellar.expert/explorer/public/tx/${transaction.stellarHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <GlassButton variant="primary" size="md" glow="blue" className="w-full">
                View on Stellar Explorer
              </GlassButton>
            </a>
          )}
          <GlassButton variant="secondary" size="md" onClick={onClose} className="flex-1">
            Close
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
}

