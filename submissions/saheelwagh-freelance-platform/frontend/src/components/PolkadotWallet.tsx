import { Wallet, Loader2, LogOut } from 'lucide-react';
import { useTypink } from 'typink';
import { useState, useEffect } from 'react';

export function PolkadotWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    wallets,
    connectedWalletIds,
    connectedAccount,
    connectWallet,
    disconnect,
  } = useTypink();

  const isConnected = connectedWalletIds.length > 0 && !!connectedAccount;

  // Debug: Log available wallets and connection state
  useEffect(() => {
    console.log('=== POLKADOT WALLET DEBUG ===');
    console.log('Available wallets:', wallets.map((w) => ({ id: w.id, name: w.name, installed: w.installed })));
    console.log('Connected wallet IDs:', connectedWalletIds);
    console.log('Connected account:', connectedAccount);
    console.log('Is connected:', isConnected);
    console.log('===========================');
  }, [wallets, connectedWalletIds, connectedAccount, isConnected]);

  // When wallet is connected but account is missing, request accounts from the wallet
  useEffect(() => {
    if (connectedWalletIds.length > 0 && !connectedAccount) {
      console.log('🔵 Wallet connected but no account. Requesting accounts from SubWallet...');
      
      // Try to get accounts from the connected wallet
      const subWalletExtension = (window as any).injectedWeb3?.['subwallet-js'];
      if (subWalletExtension) {
        subWalletExtension.enable('PolkStellar').then(() => {
          console.log('✅ SubWallet enabled, accounts should be available now');
        }).catch((err: any) => {
          console.error('❌ Failed to enable SubWallet:', err);
        });
      }
    }
  }, [connectedWalletIds, connectedAccount]);

  // Find SubWallet in available wallets (match exact ID from debug: 'subwallet-js')
  const subWallet = wallets.find((w) => 
    w.id === 'subwallet-js' ||  // Main ID from typink
    w.id === 'subwallet' || 
    w.id === 'SubWallet' || 
    w.name?.toLowerCase().includes('subwallet')
  );

  const handleConnectSubWallet = async () => {
    console.log('🔵 Connect button clicked!');
    console.log('SubWallet object:', subWallet);
    
    if (!subWallet) {
      const errorMsg = 'SubWallet not detected. Please install SubWallet extension.';
      setError(errorMsg);
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }

    if (!subWallet.installed) {
      const errorMsg = 'SubWallet is not installed. Please install it from the official store.';
      setError(errorMsg);
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      console.log('🔵 Attempting to connect to SubWallet...');
      console.log('Wallet ID:', subWallet.id);
      console.log('Wallet name:', subWallet.name);
      
      // Call the connect function
      const result = await connectWallet(subWallet.id);
      console.log('✅ Connect result:', result);
      console.log('✅ Successfully called connectWallet()');
      
      // Wait a bit for state to update
      setTimeout(() => {
        console.log('Post-connect state:');
        console.log('- connectedWalletIds:', connectedWalletIds);
        console.log('- connectedAccount:', connectedAccount);
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to SubWallet';
      setError(errorMessage);
      console.error('❌ SubWallet connection error:', err);
      alert('Connection failed: ' + errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      console.log('Disconnecting from Polkadot wallet...');
      await disconnect();
      console.log('Successfully disconnected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      console.error('Disconnect error:', err);
    }
  };

  return (
    <div className="flex items-center">
      {isConnected && connectedAccount ? (
        <button
          onClick={handleDisconnect}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white transition-all text-sm"
          title="Disconnect Polkadot Wallet"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="hidden sm:inline">
            {connectedAccount.address.slice(0, 4)}...{connectedAccount.address.slice(-4)}
          </span>
          <span className="sm:hidden">Polkadot</span>
          <LogOut className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleConnectSubWallet}
          disabled={isConnecting || !subWallet?.installed}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-purple-600/50 disabled:to-purple-700/50 text-white transition-all text-sm disabled:cursor-not-allowed"
          title={
            !subWallet?.installed
              ? 'SubWallet not detected. Please install SubWallet extension.'
              : 'Connect SubWallet'
          }
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">
                {!subWallet?.installed ? 'SubWallet' : 'Polkadot'}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
