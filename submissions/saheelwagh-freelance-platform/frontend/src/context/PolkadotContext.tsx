import { createContext, useContext, type ReactNode } from 'react';

/**
 * PolkadotContext - Manages Polkadot-specific state
 * 
 * Note: Wallet connection is handled by typeink's useTypink() hook
 * This context is for additional Polkadot-specific state management if needed
 */

interface PolkadotContextType {
  // Placeholder for future Polkadot-specific state
  // Wallet connection is managed by typeink's TypinkProvider
}

const PolkadotContext = createContext<PolkadotContextType | null>(null);

export function PolkadotProvider({ children }: { children: ReactNode }) {
  return (
    <PolkadotContext.Provider value={{}}>
      {children}
    </PolkadotContext.Provider>
  );
}

export function usePolkadot() {
  const context = useContext(PolkadotContext);
  if (!context) {
    throw new Error('usePolkadot must be used within a PolkadotProvider');
  }
  return context;
}
