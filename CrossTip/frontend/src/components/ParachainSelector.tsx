import React from 'react';

export interface Parachain {
  id: number;
  name: string;
  logo?: string;
  xcmFee: string;
  description: string;
  color: string;
}

interface ParachainSelectorProps {
  selectedParachain: number | null;
  onParachainSelect: (parachainId: number) => void;
  disabled?: boolean;
}

const SUPPORTED_PARACHAINS: Parachain[] = [
  {
    id: 1000,
    name: 'Moonbeam',
    xcmFee: '0.1',
    description: 'Ethereum-compatible smart contract platform',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  {
    id: 2000,
    name: 'Acala',
    xcmFee: '0.05',
    description: 'DeFi hub with cross-chain liquidity',
    color: 'bg-red-100 border-red-300 text-red-800',
  },
  {
    id: 2004,
    name: 'Moonriver',
    xcmFee: '0.1',
    description: 'Kusama-based Ethereum compatibility',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  },
  {
    id: 2006,
    name: 'Astar',
    xcmFee: '0.08',
    description: 'Multi-VM smart contract platform',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  {
    id: 2012,
    name: 'Parallel',
    xcmFee: '0.06',
    description: 'Lending and staking protocol',
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  {
    id: 2030,
    name: 'Bifrost',
    xcmFee: '0.04',
    description: 'Liquid staking derivatives',
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  },
  {
    id: 2034,
    name: 'HydraDX',
    xcmFee: '0.03',
    description: 'Cross-chain liquidity protocol',
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  },
  {
    id: 2104,
    name: 'Nodle',
    xcmFee: '0.02',
    description: 'IoT blockchain network',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  },
];

const ParachainSelector: React.FC<ParachainSelectorProps> = ({
  selectedParachain,
  onParachainSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Select Destination Parachain
        </h3>
        <div className="text-sm text-gray-500">
          {SUPPORTED_PARACHAINS.length} parachains available
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUPPORTED_PARACHAINS.map((parachain) => (
          <div
            key={parachain.id}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'}
              ${
                selectedParachain === parachain.id
                  ? `${parachain.color} ring-2 ring-offset-2 ring-blue-500`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => !disabled && onParachainSelect(parachain.id)}
          >
            {/* Parachain ID Badge */}
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                ID: {parachain.id}
              </span>
            </div>

            {/* Parachain Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{parachain.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{parachain.description}</p>
                </div>
              </div>

              {/* XCM Fee */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">XCM Fee:</span>
                <span className="text-sm font-medium text-gray-900">
                  {parachain.xcmFee} DOT
                </span>
              </div>

              {/* Selection Indicator */}
              {selectedParachain === parachain.id && (
                <div className="flex items-center justify-center pt-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ✓ Selected
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fee Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-400 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800">XCM Cross-Chain Messaging</h4>
            <p className="text-sm text-blue-700 mt-1">
              XCM fees vary by parachain and cover the cost of cross-consensus message delivery. 
              Lower fees indicate more efficient routing and settlement processes.
            </p>
          </div>
        </div>
      </div>

      {selectedParachain && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✓</span>
            <span className="text-sm font-medium text-green-800">
              {SUPPORTED_PARACHAINS.find(p => p.id === selectedParachain)?.name} Selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParachainSelector;
export { SUPPORTED_PARACHAINS };