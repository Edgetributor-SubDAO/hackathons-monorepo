import { coinbaseWallet, injected } from "@wagmi/connectors";
import { baseSepolia } from "wagmi/chains";
import { createConfig, http } from "wagmi";

const BASE_RPC = "https://sepolia.base.org";

const baseTransport = http(BASE_RPC);

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: baseTransport
  },
  connectors: [
    coinbaseWallet({
      appName: "Sync Flow Stellar Dispenser"
    }),
    injected({ shimDisconnect: true })
  ]
});

// BridgeVault contract address on Base Sepolia
export const bridgeVaultAddress = "0x21E28d827CAF04ca6BA6bf9fDec8885B983FCfD9";
export const hardcodedPayoutDots = 1000;


