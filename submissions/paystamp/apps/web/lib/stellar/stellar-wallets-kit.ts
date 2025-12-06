/**
 * Stellar Wallets Kit Service
 * Provides unified wallet authentication for Stellar/Soroban DApps
 * Based on: https://developers.stellar.org/docs/build/soroban-frontend
 */

import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
} from '@creit.tech/stellar-wallets-kit';

const SELECTED_WALLET_ID = 'paystamp_selected_wallet_id';

/**
 * Get the selected wallet ID from localStorage
 */
function getSelectedWalletId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_WALLET_ID);
}

/**
 * Get Stellar network passphrase
 * Defaults to Testnet for development
 */
function getNetworkPassphrase(): string {
  // In Next.js, we need to check for env vars at runtime
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
  
  if (network === 'testnet') {
    return 'Test SDF Network ; September 2015';
  } else if (network === 'mainnet') {
    return 'Public Global Stellar Network ; September 2015';
  } else {
    // Default to testnet
    return 'Test SDF Network ; September 2015';
  }
}

/**
 * Initialize StellarWalletsKit instance
 */
let kitInstance: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      modules: allowAllModules(),
      network: getNetworkPassphrase(),
      // StellarWalletsKit forces you to specify a wallet, even if the user didn't
      // select one yet, so we default to Freighter.
      // We'll work around this later in `getPublicKey`.
      selectedWalletId: getSelectedWalletId() ?? FREIGHTER_ID,
    });
  }
  return kitInstance;
}

/**
 * Get the public key of the connected wallet
 * Returns null if no wallet is connected
 */
export async function getPublicKey(): Promise<string | null> {
  try {
    const selectedWalletId = getSelectedWalletId();
    if (!selectedWalletId) {
      return null;
    }

    const kit = getKit();
    const { address } = await kit.getAddress();
    return address;
  } catch (error) {
    console.error('Error getting public key:', error);
    return null;
  }
}

/**
 * Set the selected wallet
 */
export async function setWallet(walletId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(SELECTED_WALLET_ID, walletId);
  const kit = getKit();
  kit.setWallet(walletId);
}

/**
 * Connect to a wallet
 * Opens the wallet selection modal
 */
export async function connect(
  callback?: (publicKey: string) => void | Promise<void>
): Promise<string | null> {
  try {
    const kit = getKit();
    
    const walletId = await kit.openModal({
      onWalletSelected: async (option) => {
        try {
          await setWallet(option.id);
          
          // Get the public key after wallet is selected
          const { address } = await kit.getAddress();
          
          if (callback) {
            await callback(address);
          }
          
          return option.id;
        } catch (error) {
          console.error('Error in wallet selection callback:', error);
          throw error;
        }
      },
    });

    return walletId;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

/**
 * Disconnect the current wallet
 */
export async function disconnect(
  callback?: () => void | Promise<void>
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(SELECTED_WALLET_ID);
  const kit = getKit();
  kit.disconnect();
  
  if (callback) {
    await callback();
  }
}

/**
 * Sign a transaction
 * This is used for Soroban contract interactions
 */
export async function signTransaction(
  xdr: string,
  network?: string
): Promise<string> {
  const kit = getKit();
  const networkPassphrase = network || getNetworkPassphrase();
  
  try {
    const signedXdr = await kit.signTransaction(xdr, networkPassphrase);
    return signedXdr;
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw error;
  }
}

/**
 * Check if a wallet is currently connected
 */
export async function isConnected(): Promise<boolean> {
  try {
    const publicKey = await getPublicKey();
    return !!publicKey;
  } catch {
    return false;
  }
}

/**
 * Get the currently selected wallet ID
 */
export function getSelectedWallet(): string | null {
  return getSelectedWalletId();
}

/**
 * Reset the kit instance (useful for testing or network changes)
 */
export function resetKit(): void {
  kitInstance = null;
}

