// Re-export all types
export * from "./types.js";

// Re-export client
export * from "./client.js";

// Re-export server
export * from "./server.js";

// Convenience exports
export { X402FlashClient as FlashClient } from "./client.js";
export {
  X402FlashServer as FlashServer,
  paymentMiddleware,
  x402FlashMiddleware,
} from "./server.js";
