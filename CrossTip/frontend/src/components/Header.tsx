import { useWallet } from '../contexts/WalletContext';
import { Link } from 'react-router-dom';

const Header = () => {
  const {
    stellarAddress,
    polkadotAddress,
    connectStellar,
    connectPolkadot,
    disconnectStellar,
    disconnectPolkadot,
  } = useWallet();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-gray-900 bg-opacity-80 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-stellar to-polkadot bg-clip-text text-transparent">
              CrossTip
            </div>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              to="/app"
              className="text-gray-300 hover:text-white transition-colors"
            >
              App
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/accounts"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Accounts
            </Link>

            <div className="flex items-center space-x-2 ml-4">
              {stellarAddress ? (
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-2 bg-stellar bg-opacity-20 text-stellar rounded-lg text-sm">
                    Stellar: {truncateAddress(stellarAddress)}
                  </div>
                  <button
                    onClick={disconnectStellar}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectStellar}
                  className="px-4 py-2 bg-stellar hover:bg-stellar-dark text-white rounded-lg font-medium transition-colors"
                >
                  Connect Stellar
                </button>
              )}

              {polkadotAddress ? (
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-2 bg-polkadot bg-opacity-20 text-polkadot rounded-lg text-sm">
                    Polkadot: {truncateAddress(polkadotAddress)}
                  </div>
                  <button
                    onClick={disconnectPolkadot}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectPolkadot}
                  className="px-4 py-2 bg-polkadot hover:bg-polkadot-dark text-white rounded-lg font-medium transition-colors"
                >
                  Connect Polkadot
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
