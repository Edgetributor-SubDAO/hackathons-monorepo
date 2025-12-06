import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { mnemonicValidate } from "@polkadot/util-crypto";
import { logger } from "../logger";

export class PolkadotClient {
  private api?: ApiPromise;
  private keypair?: KeyringPair;

  constructor(private readonly endpoint: string, private readonly seedPhrase: string) {}

  async init(): Promise<void> {
    if (!mnemonicValidate(this.seedPhrase)) {
      throw new Error("Invalid Polkadot seed phrase");
    }

    const provider = new WsProvider(this.endpoint);
    this.api = await ApiPromise.create({ provider });

    const keyring = new Keyring({ type: "sr25519" });
    this.keypair = keyring.addFromUri(this.seedPhrase);

    const account = await this.api.query.system.account(this.keypair.address);
    const free = (account as unknown as { data: { free: { toString(): string } } }).data.free;

    logger.info(
      {
        dispenser: this.keypair.address,
        endpoint: this.endpoint,
        free: free.toString()
      },
      "Connected to Asset Hub (Substrate) endpoint"
    );
  }

  async getFreeBalance(): Promise<bigint> {
    if (!this.api || !this.keypair) {
      throw new Error("Polkadot client not initialized");
    }
    const account = await this.api.query.system.account(this.keypair.address);
    const free = (account as unknown as { data: { free: { toString(): string } } }).data.free;
    return BigInt(free.toString());
  }

  async transferKeepAlive(destination: string, amountPlanck: bigint): Promise<string> {
    if (!this.api || !this.keypair) {
      throw new Error("Polkadot client not initialized");
    }

    const txHash = await new Promise<string>((resolve, reject) => {
      this.api!.tx.balances
        .transferKeepAlive(destination, amountPlanck)
        .signAndSend(this.keypair!, (result) => {
          if (result.status.isInBlock) {
            logger.info({ hash: result.txHash.toHex() }, "Transfer included in block");
          }

          if (result.status.isFinalized) {
            resolve(result.txHash.toHex());
          }

          if (result.isError) {
            reject(new Error(`Polkadot transfer failed: ${result.status.toString()}`));
          }
        })
        .catch(reject);
    });

    logger.info({ destination, txHash }, "Polkadot payout finalised");
    return txHash;
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = undefined;
    }
  }
}
