'use client';

import { useState } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner, SkeletonLoader } from '@/components/ui/loading';
import Link from 'next/link';
import { Lock, Inbox } from 'lucide-react';

// Mock payment data - replace with actual API call
const mockPayments = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    serviceId: 'SERVICE1',
    amount: '500',
    currency: 'XLM',
    status: 'success',
    transactionHash: 'abc123def456...',
    memo: 'MEMO123',
  },
  {
    id: '2',
    date: new Date('2024-01-10'),
    serviceId: 'SERVICE2',
    amount: '750',
    currency: 'XLM',
    status: 'success',
    transactionHash: 'xyz789ghi012...',
    memo: 'MEMO456',
  },
  {
    id: '3',
    date: new Date('2024-01-05'),
    serviceId: 'SERVICE1',
    amount: '300',
    currency: 'USDC',
    status: 'failed',
    transactionHash: 'mno345pqr678...',
    memo: 'MEMO789',
  },
];

export default function HistoryPage() {
  const { stellarAddress } = useWalletStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  if (!stellarAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard glow="blue" className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Wallet Required</h1>
          <p className="text-gray-300 mb-6">Connect your wallet to view payment history</p>
          <Link href="/connect">
            <GlassButton variant="primary" size="md" glow="blue">
              Connect Wallet
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.serviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.memo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesService = serviceFilter === 'all' || payment.serviceId === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const services = Array.from(new Set(mockPayments.map((p) => p.serviceId)));

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow text-balance">Payment History</h1>
          <p className="text-lg text-gray-200 font-medium leading-relaxed">View all your past transactions and payments</p>
        </div>

        {/* Filters */}
        <GlassCard glow="blue" className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <GlassInput
                placeholder="Search by transaction hash, service, or memo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="glass-input w-full px-4 py-3 rounded-xl text-white"
              >
                <option value="all" className="bg-gray-900">All Status</option>
                <option value="success" className="bg-gray-900">Success</option>
                <option value="failed" className="bg-gray-900">Failed</option>
                <option value="pending" className="bg-gray-900">Pending</option>
              </select>
            </div>
            <div>
              <select
                value={serviceFilter}
                onChange={(e) => {
                  setServiceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="glass-input w-full px-4 py-3 rounded-xl text-white"
              >
                <option value="all" className="bg-gray-900">All Services</option>
                {services.map((service) => (
                  <option key={service} value={service} className="bg-gray-900">
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Payment Cards */}
        {paginatedPayments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedPayments.map((payment, index) => (
              <GlassCard
                key={payment.id}
                hover
                glow={payment.status === 'success' ? 'green' : payment.status === 'failed' ? 'red' : 'yellow'}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{payment.serviceId}</h3>
                    <p className="text-gray-400 text-sm">
                      {payment.date.toLocaleDateString()} {payment.date.toLocaleTimeString()}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      payment.status === 'success'
                        ? 'success'
                        : payment.status === 'failed'
                          ? 'error'
                          : 'warning'
                    }
                  >
                    {payment.status}
                  </StatusBadge>
                </div>

                <div className="glass-lg p-4 rounded-xl mb-4">
                  <div className="text-3xl font-bold text-gradient mb-1">
                    {payment.amount} {payment.currency}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction:</span>
                    <code className="text-gray-300 font-mono text-xs">
                      {payment.transactionHash.slice(0, 8)}...{payment.transactionHash.slice(-6)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memo:</span>
                    <code className="text-gray-300 font-mono">{payment.memo}</code>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${payment.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <GlassButton variant="secondary" size="sm" className="w-full">
                      View Explorer
                    </GlassButton>
                  </a>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard glow="blue" className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Inbox className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">No Payments Found</h2>
            <p className="text-gray-300 mb-6">
              {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Make your first payment to get started'}
            </p>
            {(!searchTerm && statusFilter === 'all' && serviceFilter === 'all') && (
              <Link href="/payment">
                <GlassButton variant="primary" size="md" glow="blue">
                  Make Payment
                </GlassButton>
              </Link>
            )}
          </GlassCard>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <GlassCard glow="blue" className="flex items-center justify-between">
            <div className="text-gray-300 text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of{' '}
              {filteredPayments.length} payments
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </GlassButton>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`glass-button px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-electric-blue/20 border-electric-blue text-white'
                        : 'text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

