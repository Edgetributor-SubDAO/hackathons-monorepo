import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  SorobanRpc,
  TransactionBuilder
} from "@stellar/stellar-sdk";
import { logger } from "./logger";

export class StellarClient {
  private readonly rpc: SorobanRpc.Server;
  private readonly keypair: Keypair;
  private readonly networkPassphrase: string;

  constructor(rpcUrl: string, secretKey: string, networkPassphrase?: string) {
    this.rpc = new SorobanRpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://") });
    this.keypair = Keypair.fromSecret(secretKey);
    this.networkPassphrase = networkPassphrase ?? Networks.TESTNET;
  }

  get publicKey(): string {
    return this.keypair.publicKey();
  }

  async init(): Promise<void> {
    try {
      await this.rpc.getAccount(this.publicKey);
      logger.info(
        {
          dispenser: this.publicKey,
          rpcUrl: this.rpc.serverURL
        },
        "Connected to Stellar testnet"
      );
    } catch (err) {
      logger.error({ err }, "Failed to initialize Stellar client");
      throw err;
    }
  }

  /**
   * Fetch the latest account state from Soroban RPC.
   */
  private async loadAccount(): Promise<Account> {
    const account = await this.rpc.getAccount(this.publicKey);
    return new Account(account.accountId(), account.sequenceNumber());
  }

  /**
   * Send a simple XLM payment from the dispenser to a destination account.
   *
   * @param destination Stellar address (G...) on testnet
   * @param amountXlm   Amount as a string in lumens (e.g. "10")
   */
  async sendNativePayment(destination: string, amountXlm: string): Promise<string> {
    logger.info(
      { from: this.publicKey, to: destination, amountXlm },
      "Preparing Stellar payment"
    );

    const sourceAccount = await this.loadAccount();

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: amountXlm
        })
      )
      .setTimeout(60)
      .build();

    tx.sign(this.keypair);

    const resp = await this.rpc.sendTransaction(tx);

    if (resp.errorResult) {
      logger.error({ error: resp.errorResult }, "Stellar payment failed");
      throw new Error(`Stellar payment failed: ${resp.errorResult}`);
    }

    logger.info({ hash: resp.hash }, "Stellar payment submitted");
    return resp.hash;
  }
}


