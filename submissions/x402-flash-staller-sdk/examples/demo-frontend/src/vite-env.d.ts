/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CONTRACT_ID: string;
  readonly VITE_STELLAR_RPC_URL: string;
  readonly VITE_NETWORK_PASSPHRASE: string;
  readonly VITE_NATIVE_TOKEN_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Freighter wallet types
interface Window {
  freighter?: boolean;
}
