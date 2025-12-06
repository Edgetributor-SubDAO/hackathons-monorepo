/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HORIZON_URL: string
  readonly VITE_STELLAR_NETWORK: string
  readonly VITE_SOROBAN_CONTRACT_ID: string
  readonly VITE_POLKADOT_WS: string
  readonly VITE_POLKADOT_CONTRACT: string
  readonly VITE_RELAYER_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
