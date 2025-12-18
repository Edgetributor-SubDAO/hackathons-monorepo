// src/config.ts
export const config = {
  stellar: {
    horizonUrl: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    networkPassphrase: import.meta.env.VITE_STELLAR_NETWORK || 'Test SDF Network ; September 2015',
    contractId: import.meta.env.VITE_SOROBAN_CONTRACT_ID || 'CDZRCKLDQ22UZ2NDBAFD2HCUAXPECKND2K7JDQZ7Z4TYG3QJ2KJJGKCM',
  },
  axelar: {
    contractId: import.meta.env.VITE_AXELAR_CONTRACT_ID || 'CDZRCKLDQ22UZ2NDBAFD2HCUAXPECKND2K7JDQZ7Z4TYG3QJ2KJJGKCM',
    gatewayAddress: import.meta.env.VITE_AXELAR_GATEWAY || 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    gasServiceAddress: import.meta.env.VITE_AXELAR_GAS_SERVICE || 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    supportedChains: ['ethereum', 'polygon', 'avalanche', 'base', 'arbitrum'],
  },
  polkadot: {
    wsEndpoint: import.meta.env.VITE_POLKADOT_WS || 'wss://rpc.polkadot.io',
    disableAutoConnect: import.meta.env.VITE_DISABLE_POLKADOT_AUTO_CONNECT === 'true',
    contractAddress: import.meta.env.VITE_POLKADOT_CONTRACT || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    supportedParachains: [
      { id: 1000, name: 'Moonbeam', fee: '0.1 DOT' },
      { id: 2000, name: 'Acala', fee: '0.05 DOT' },
      { id: 2004, name: 'Moonriver', fee: '0.1 DOT' },
      { id: 2006, name: 'Astar', fee: '0.08 DOT' },
      { id: 2012, name: 'Parallel', fee: '0.06 DOT' },
      { id: 2030, name: 'Bifrost', fee: '0.04 DOT' },
      { id: 2034, name: 'HydraDX', fee: '0.03 DOT' },
      { id: 2104, name: 'Nodle', fee: '0.02 DOT' }
    ],
  },
  relayer: {
    apiUrl: import.meta.env.VITE_RELAYER_API || 'http://localhost:3001',
    healthEndpoint: '/health',
    statusEndpoint: '/status',
    balanceEndpoint: '/balance',
  },
  networks: {
    axelar: [
      { 
        id: 'ethereum', 
        name: 'Ethereum', 
        symbol: 'ETH', 
        fee: '0.01 ETH',
        estimatedTime: '2-5 min',
        icon: '⟠'
      },
      { 
        id: 'polygon', 
        name: 'Polygon', 
        symbol: 'MATIC', 
        fee: '1 MATIC',
        estimatedTime: '2-5 min',
        icon: '◆'
      },
      { 
        id: 'avalanche', 
        name: 'Avalanche', 
        symbol: 'AVAX', 
        fee: '0.1 AVAX',
        estimatedTime: '2-5 min',
        icon: '🔺'
      },
      { 
        id: 'base', 
        name: 'Base', 
        symbol: 'ETH', 
        fee: '0.005 ETH',
        estimatedTime: '2-5 min',
        icon: '🔵'
      },
      { 
        id: 'arbitrum', 
        name: 'Arbitrum', 
        symbol: 'ETH', 
        fee: '0.001 ETH',
        estimatedTime: '2-5 min',
        icon: '🔷'
      }
    ],
    xcm: [
      { 
        id: 1000, 
        name: 'Moonbeam', 
        symbol: 'GLMR', 
        fee: '0.1 DOT',
        estimatedTime: '30-60s',
        icon: '🌙'
      },
      { 
        id: 2000, 
        name: 'Acala', 
        symbol: 'ACA', 
        fee: '0.05 DOT',
        estimatedTime: '30-60s',
        icon: '🟦'
      },
      { 
        id: 2004, 
        name: 'Moonriver', 
        symbol: 'MOVR', 
        fee: '0.1 DOT',
        estimatedTime: '30-60s',
        icon: '🌕'
      },
      { 
        id: 2006, 
        name: 'Astar', 
        symbol: 'ASTR', 
        fee: '0.08 DOT',
        estimatedTime: '30-60s',
        icon: '⭐'
      },
      { 
        id: 2012, 
        name: 'Parallel', 
        symbol: 'PARA', 
        fee: '0.06 DOT',
        estimatedTime: '30-60s',
        icon: '∥'
      },
      { 
        id: 2030, 
        name: 'Bifrost', 
        symbol: 'BNC', 
        fee: '0.04 DOT',
        estimatedTime: '30-60s',
        icon: '🌈'
      },
      { 
        id: 2034, 
        name: 'HydraDX', 
        symbol: 'HDX', 
        fee: '0.03 DOT',
        estimatedTime: '30-60s',
        icon: '💧'
      },
      { 
        id: 2104, 
        name: 'Nodle', 
        symbol: 'NODL', 
        fee: '0.02 DOT',
        estimatedTime: '30-60s',
        icon: '📡'
      }
    ]
  },
  // Development/Testing Configuration
  development: {
    testKeypair: {
      publicKey: 'GDIXXFCHOAZ2DJBLDYGICVRRS6QVHIP3IDXORR7CZHJIYL6RH4EXRFJR',
      // Note: Never expose secret keys in production
      secretKey: import.meta.env.DEV ? 'SCQ35XYPNDEDARCAXFK7JKEP67BQ5NX2IBEDFK5NJIL7CMN4SZLUZ2Z7' : undefined,
    },
    testMode: import.meta.env.DEV === true,
    mockWalletConnection: import.meta.env.VITE_MOCK_WALLET === 'true',
  }
};
