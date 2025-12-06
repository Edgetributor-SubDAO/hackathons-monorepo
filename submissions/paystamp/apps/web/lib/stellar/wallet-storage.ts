/**
 * Secure wallet storage
 * Stores encrypted keypairs in localStorage
 */

const STORAGE_KEY = 'paystamp_stellar_wallet';
const ENCRYPTION_KEY = 'paystamp_encryption_key'; // In production, use proper encryption

export interface StoredWallet {
  publicKey: string;
  encryptedSecret: string;
  network: 'testnet' | 'mainnet';
  createdAt: string;
}

/**
 * Simple encryption (for demo - use proper encryption in production)
 */
function encrypt(secret: string): string {
  // In production, use proper encryption like Web Crypto API
  // This is a simple base64 encoding for demo purposes
  return btoa(secret);
}

function decrypt(encrypted: string): string {
  // In production, use proper decryption
  return atob(encrypted);
}

export class WalletStorage {
  /**
   * Save wallet to storage
   */
  static save(publicKey: string, secretKey: string, network: 'testnet' | 'mainnet'): void {
    const wallet: StoredWallet = {
      publicKey,
      encryptedSecret: encrypt(secretKey),
      network,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
  }

  /**
   * Load wallet from storage
   */
  static load(): StoredWallet | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Get decrypted secret key
   */
  static getSecretKey(): string | null {
    const wallet = this.load();
    if (!wallet) return null;
    return decrypt(wallet.encryptedSecret);
  }

  /**
   * Get public key
   */
  static getPublicKey(): string | null {
    const wallet = this.load();
    return wallet?.publicKey || null;
  }

  /**
   * Clear wallet from storage
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if wallet exists
   */
  static exists(): boolean {
    return this.load() !== null;
  }
}

