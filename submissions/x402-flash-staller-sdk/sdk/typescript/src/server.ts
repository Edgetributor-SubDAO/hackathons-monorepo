import { Request, Response, NextFunction } from "express";
import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";
import {
  X402PaymentPayload,
  PaymentAuth,
  X402FlashServerConfig,
  RoutesConfig,
  RouteConfig,
  PaymentConfig,
  X402PaymentRequirements,
  X402PaymentResponse,
} from "./types.js";
import * as nacl from "tweetnacl";

export class X402FlashServer {
  private server: SorobanRpc.Server;
  private keypair: Keypair;
  private contractId: string;
  private networkPassphrase: string;
  private paymentAddress: string;

  constructor(config: X402FlashServerConfig) {
    this.server = new SorobanRpc.Server(config.rpcUrl);
    this.keypair = Keypair.fromSecret(config.secretKey);
    this.contractId = config.contractId;
    this.networkPassphrase = config.networkPassphrase;
    this.paymentAddress = config.paymentAddress;
  }

  /**
   * Parse route configuration (supports both simple price string and full config object)
   */
  private parseRouteConfig(
    config: string | RouteConfig,
    defaultNetwork: string,
    defaultToken: string
  ): Required<RouteConfig> {
    if (typeof config === "string") {
      return {
        price: config,
        token: defaultToken,
        network: defaultNetwork,
        config: {},
      };
    }

    return {
      price: config.price,
      token: config.token || defaultToken,
      network: config.network || defaultNetwork,
      config: config.config || {},
    };
  }

  /**
   * Express middleware for x402-flash payments
   * Compatible with x402-express API format
   */
  middleware(routes: RoutesConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const routeKey = `${req.method} ${req.path}`;
      const rawRouteConfig = routes[routeKey];

      if (!rawRouteConfig) {
        return next();
      }

      // Parse route configuration
      const routeConfig = this.parseRouteConfig(
        rawRouteConfig,
        "stellar-testnet",
        "native"
      );

      const paymentHeader = req.header("X-Payment");

      if (!paymentHeader) {
        // Return 402 with payment requirements following x402 standard
        const requirements: X402PaymentRequirements = {
          x402Version: 1,
          accepts: [
            {
              scheme: "flash",
              network: routeConfig.network,
              maxAmountRequired: routeConfig.price,
              resource: routeConfig.config.resource || req.originalUrl,
              description:
                routeConfig.config.description || `Access to ${req.path}`,
              mimeType: routeConfig.config.mimeType || "application/json",
              payTo: this.paymentAddress,
              maxTimeoutSeconds: routeConfig.config.maxTimeoutSeconds || 60,
              asset: routeConfig.token,
              extra: {},
            },
          ],
          error: "Payment required",
        };

        return res.status(402).json(requirements);
      }

      // Parse and validate payment
      try {
        const decoded = Buffer.from(paymentHeader, "base64").toString("utf-8");
        const paymentPayload: X402PaymentPayload = JSON.parse(decoded);

        if (paymentPayload.x402Version !== 1) {
          return res.status(400).json({ error: "Unsupported x402 version" });
        }

        if (paymentPayload.scheme !== "flash") {
          return res
            .status(400)
            .json({ error: "Unsupported payment scheme. Expected: flash" });
        }

        // Verify payment network matches
        if (paymentPayload.network !== routeConfig.network) {
          return res.status(400).json({
            error: `Network mismatch. Expected: ${routeConfig.network}, Got: ${paymentPayload.network}`,
          });
        }

        // Verify and settle payment
        const { auth, signature, publicKey } = paymentPayload.payload;

        // Validate payment amount
        if (BigInt(auth.amount) < BigInt(routeConfig.price)) {
          return res.status(402).json({
            error: `Insufficient payment. Required: ${routeConfig.price}, Got: ${auth.amount}`,
          });
        }

        // Settle payment on-chain (async - doesn't block response)
        this.settlePaymentAsync(auth, signature, publicKey).catch((err) => {
          console.error("❌ Settlement failed:", err);
        });

        // Immediately respond with success (flash!)
        const paymentResponse: X402PaymentResponse = {
          success: true,
          network: paymentPayload.network,
          timestamp: Date.now(),
        };

        res.setHeader(
          "X-Payment-Response",
          Buffer.from(JSON.stringify(paymentResponse)).toString("base64")
        );

        next();
      } catch (err) {
        console.error("❌ Payment processing error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Invalid payment";
        return res.status(400).json({ error: errorMessage });
      }
    };
  }

  /**
   * Settle payment on-chain (async, doesn't block response)
   */
  private async settlePaymentAsync(
    auth: PaymentAuth,
    signature: string,
    publicKey: string
  ): Promise<void> {
    try {
      const account = await this.server.getAccount(this.keypair.publicKey());

      const contract = new Contract(this.contractId);

      // Convert signature from hex to bytes
      const sigBytes = Buffer.from(signature, "hex");

      const tx = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "settle_payment",
            nativeToScVal(Address.fromString(auth.client), { type: "address" }),
            nativeToScVal(Address.fromString(auth.server), { type: "address" }),
            nativeToScVal(auth, { type: "map" }), // Convert PaymentAuth to ScVal map
            nativeToScVal(sigBytes, { type: "bytes" }),
            nativeToScVal(Buffer.from(publicKey), { type: "bytes" })
          )
        )
        .setTimeout(30)
        .build();

      tx.sign(this.keypair);

      const response = await this.server.sendTransaction(tx);

      console.log(
        `✅ Payment settled: ${auth.amount} stroops from ${auth.client.slice(0, 8)}...`
      );
      console.log(`   Transaction: ${response.hash}`);
    } catch (error) {
      console.error("❌ Settlement error:", error);
      throw error;
    }
  }

  /**
   * Verify payment signature (can be used for additional validation)
   */
  verifySignature(
    auth: PaymentAuth,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const message = this.serializeAuth(auth);
      const messageHash = nacl.hash(Buffer.from(message));
      const sigBytes = Buffer.from(signature, "hex");
      const pubKeyBytes = Keypair.fromPublicKey(publicKey).rawPublicKey();

      return nacl.sign.detached.verify(messageHash, sigBytes, pubKeyBytes);
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Serialize payment auth for verification
   */
  private serializeAuth(auth: PaymentAuth): string {
    return JSON.stringify({
      settlementContract: auth.settlementContract,
      client: auth.client,
      server: auth.server,
      token: auth.token,
      amount: auth.amount,
      nonce: auth.nonce,
      deadline: auth.deadline,
    });
  }
}

/**
 * Convenience function to create middleware (x402-express compatible API)
 */
export function paymentMiddleware(
  config: X402FlashServerConfig,
  routes: RoutesConfig
) {
  const server = new X402FlashServer(config);
  return server.middleware(routes);
}

/**
 * Legacy alias for backward compatibility
 */
export function x402FlashMiddleware(
  config: X402FlashServerConfig,
  routes: any
) {
  const server = new X402FlashServer(config);
  return server.middleware(routes);
}
