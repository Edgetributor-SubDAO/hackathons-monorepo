import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext.tsx';
import { EnhancedWalletProvider } from './contexts/EnhancedWalletContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import WalletErrorBoundary from './components/WalletErrorBoundary.tsx';
import Header from './components/Header.tsx';
import LandingPage from './pages/LandingPage.tsx';
import HomePage from './pages/HomePage.tsx';
import CreatorDashboard from './pages/CreatorDashboard.tsx';
import TipPage from './pages/TipPage.tsx';
import AccountManager from './components/AccountManager.tsx';

function App() {
  console.log('App component rendering');

  return (
    <ErrorBoundary>
      <WalletErrorBoundary>
        <WalletProvider>
          <EnhancedWalletProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
                <Header />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/app" element={<HomePage />} />
                  <Route path="/dashboard" element={<CreatorDashboard />} />
                  <Route path="/accounts" element={<AccountManager />} />
                  <Route path="/tip/:creatorId" element={<TipPage />} />
                </Routes>
              </div>
            </Router>
          </EnhancedWalletProvider>
        </WalletProvider>
      </WalletErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
