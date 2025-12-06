import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import { WalletProvider } from "./wallet/WalletContext";
import FetchWalletInfo from "./components/FetchWalletInfo";
import ReputationSBT from "./components/ReputationSBT";

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<LandingPage />} />
          <Route path="/reputation" element={<Dashboard />} />
          <Route path="/about" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet-info" element={<FetchWalletInfo />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reputation-sbt" element={<ReputationSBT />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
