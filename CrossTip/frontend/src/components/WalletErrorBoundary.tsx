import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class WalletErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('WalletErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WalletErrorBoundary componentDidCatch:', error, errorInfo);
    
    // Check if this is a context error
    if (error.message?.includes('useWallet must be used within WalletProvider') ||
        error.message?.includes('Cannot read properties of undefined')) {
      console.error('Detected context provider error - this might be caused by extension conflicts');
    }
    
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    console.log('Retrying after wallet context error...');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    console.log('Reloading page due to wallet context error...');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="max-w-md mx-auto text-center text-white p-8 bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Wallet Context Error</h2>
            <p className="text-gray-300 mb-4">
              {this.state.error?.message?.includes('useWallet must be used within WalletProvider') 
                ? 'There was an issue initializing the wallet context. This might be caused by browser extension conflicts.'
                : this.state.error?.message || 'An unexpected wallet error occurred'
              }
            </p>
            
            {this.state.error?.message?.includes('useWallet must be used within WalletProvider') && (
              <div className="text-sm text-gray-400 mb-6 p-4 bg-gray-900 rounded-lg">
                <p className="font-semibold mb-2">Troubleshooting:</p>
                <ul className="text-left space-y-1">
                  <li>• Try disabling Phantom wallet extension temporarily</li>
                  <li>• Clear browser cache and reload</li>
                  <li>• Check browser console for extension conflicts</li>
                  <li>• Make sure only one wallet extension is active</li>
                </ul>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Show Error Details
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 rounded text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error?.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;