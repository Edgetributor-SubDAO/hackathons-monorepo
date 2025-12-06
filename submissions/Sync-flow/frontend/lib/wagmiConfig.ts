import { coinbaseWallet, injected } from "@wagmi/connectors";
import { baseSepolia } from "wagmi/chains";
import { createConfig, http } from "wagmi";

const BASE_RPC = "https://sepolia.base.org";
const BRIDGE_VAULT = "0x21E28d827CAF04ca6BA6bf9fDec8885B983FCfD9";

const baseTransport = http(BASE_RPC);

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: baseTransport
  },
  connectors: [
    coinbaseWallet({
      appName: "Sync Flow Bridge",
      preference: { options: "all" }
    }),
    injected({ shimDisconnect: true })
  ]
});

export const bridgeVaultAddress = BRIDGE_VAULT as `0x${string}`;
export const hardcodedPayoutDots = 1000;
