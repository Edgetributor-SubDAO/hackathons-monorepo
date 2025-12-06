import {
  Contract,
  EventLog,
  JsonRpcProvider,
  WebSocketProvider,
  Provider
} from "ethers";
import { BridgeVaultAbi } from "./abi/BridgeVault";
import { appConfig } from "./config";
import { logger } from "./logger";
import { PolkadotClient } from "./clients/polkadotClient";
import { ProcessedStore } from "./storage/processedStore";
import { DepositEventPayload } from "./types";
import { decimalToPlanck, weiToEth } from "./utils/conversions";
import { sleep } from "./utils/time";

export class BridgeRelayer {
  private readonly provider: Provider;
  private readonly contract: Contract;
  private readonly polkadot = new PolkadotClient(
    appConfig.polkadotRpcUrl,
    appConfig.polkadotSeedPhrase
  );
  private readonly processedStore = new ProcessedStore();
  private readonly queue: DepositEventPayload[] = [];
  private activeJobs = 0;
  private running = false;
  private pollInterval?: NodeJS.Timeout;
  private latestCheckedBlock = 0;
  private polkadotReady = false;

  constructor() {
    this.provider = appConfig.baseWssRpcUrl
      ? new WebSocketProvider(appConfig.baseWssRpcUrl)
      : new JsonRpcProvider(appConfig.baseRpcUrl);

    this.contract = new Contract(appConfig.baseVaultAddress, BridgeVaultAbi, this.provider);
  }

  async start(): Promise<void> {
    logger.info(
      {
        baseRpcUrl: appConfig.baseRpcUrl,
        baseVaultAddress: appConfig.baseVaultAddress,
        polkadotRpcUrl: appConfig.polkadotRpcUrl,
        pollIntervalMs: appConfig.pollIntervalMs
      },
      "Starting bridge relayer"
    );

    await this.processedStore.init();

    // Initialise Polkadot client in the background.
    // We don't want Base-side detection to block on WS latency,
    // so payouts will wait until this flag is true.
    void this.polkadot
      .init()
      .then(() => {
        this.polkadotReady = true;
        logger.info("Polkadot client initialised");
        // In case there are queued deposits waiting, kick the drain loop.
        void this.drainQueue();
      })
      .catch((err) => {
        logger.error({ err }, "Polkadot client failed to initialise");
      });

    this.running = true;

    if (this.provider instanceof WebSocketProvider) {
      logger.info("Using WebSocket subscription for deposits");
      this.contract.on(
        "Deposit",
        async (
          sender: string,
          amount: bigint,
          feeAmount: bigint,
          netAmount: bigint,
          polkadotAddress: string,
          depositId: string,
          event: EventLog
        ) => {
          const payload: DepositEventPayload = {
            sender,
            amount,
            feeAmount,
            netAmount,
            polkadotAddress,
            depositId,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          };
          await this.enqueue(payload);
        }
      );
    } else {
      logger.info("Using HTTP polling for deposits");
      const head = await this.provider.getBlockNumber();
      this.latestCheckedBlock = Math.max(0, head - appConfig.pollLookbackBlocks);
      logger.info(
        {
          head,
          startingBlock: this.latestCheckedBlock + 1,
          lookback: appConfig.pollLookbackBlocks
        },
        "Initialized poller block range"
      );
      await this.pollForDeposits();
      this.pollInterval = setInterval(() => {
        void this.pollForDeposits().catch((err) => {
          logger.error({ err }, "Deposit polling failed");
        });
      }, appConfig.pollIntervalMs);
    }

    logger.info("Bridge relayer started. Watching for deposits…");
  }

  private async pollForDeposits(): Promise<void> {
    if (!this.running) return;
    const currentBlock = await this.provider.getBlockNumber();
    const fromBlock = this.latestCheckedBlock + 1;

    if (fromBlock > currentBlock) {
      return;
    }

    const toBlock = currentBlock;
    const events = await this.contract.queryFilter(
      this.contract.filters.Deposit(),
      fromBlock,
      toBlock
    );

    if (events.length > 0) {
      logger.info(
        { count: events.length, fromBlock, toBlock },
        "Detected deposits via polling"
      );
    }

    for (const event of events) {
      const typedEvent = event as EventLog;
      const args = typedEvent.args as unknown as
        | {
            sender: string;
            amount: bigint;
            feeAmount: bigint;
            netAmount: bigint;
            polkadotAddress: string;
            depositId: string;
          }
        | undefined;

      if (!args) continue;

      const payload: DepositEventPayload = {
        sender: args.sender,
        amount: args.amount,
        feeAmount: args.feeAmount,
        netAmount: args.netAmount,
        polkadotAddress: args.polkadotAddress,
        depositId: args.depositId,
        blockNumber: typedEvent.blockNumber,
        transactionHash: typedEvent.transactionHash
      };

      await this.enqueue(payload);
    }

    this.latestCheckedBlock = toBlock;
  }

  private async enqueue(deposit: DepositEventPayload): Promise<void> {
    if (this.processedStore.has(deposit.depositId)) {
      logger.warn({ depositId: deposit.depositId }, "Deposit already processed, skipping");
      return;
    }

    this.queue.push(deposit);
    this.drainQueue().catch((err) => {
      logger.error(err, "Failed to drain queue");
    });
  }

  private async drainQueue(): Promise<void> {
    if (!this.running) return;

    while (this.activeJobs < appConfig.maxParallelPayouts && this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) break;

      this.activeJobs++;
      this.processDeposit(next)
        .catch((err) => {
          logger.error({ depositId: next.depositId, err }, "Deposit processing failed");
        })
        .finally(() => {
          this.activeJobs--;
          if (this.queue.length > 0) {
            void this.drainQueue();
          }
        });
    }
  }

  private async processDeposit(deposit: DepositEventPayload): Promise<void> {
    if (!this.polkadotReady) {
      logger.warn(
        { depositId: deposit.depositId },
        "Polkadot client not ready yet, re-queueing deposit"
      );
      // Put it back at the end of the queue and try again later.
      this.queue.push(deposit);
      await sleep(1000);
      return;
    }

    logger.info(
      { depositId: deposit.depositId, tx: deposit.transactionHash },
      "Processing deposit"
    );

    await this.waitForConfirmations(deposit.blockNumber);

    const netEth = weiToEth(deposit.netAmount);
    const payoutAssetAmount = appConfig.hardcodedPayoutDots;
    const payoutPlanck = decimalToPlanck(
      payoutAssetAmount,
      appConfig.polkadotAssetSymbol
    );
    const dispenserBalance = await this.polkadot.getFreeBalance();

    if (payoutPlanck >= dispenserBalance) {
      logger.error(
        {
          depositId: deposit.depositId,
          payoutPlanck: payoutPlanck.toString(),
          dispenserBalance: dispenserBalance.toString()
        },
        "Insufficient dispenser liquidity"
      );
      return;
    }

    const txHash = await this.polkadot.transferKeepAlive(deposit.polkadotAddress, payoutPlanck);
    await this.processedStore.add(deposit.depositId);

    logger.info(
      {
        depositId: deposit.depositId,
        txHash,
        polkadotAddress: deposit.polkadotAddress,
        payoutPlanck: payoutPlanck.toString()
      },
      "Payout completed"
    );
  }

  private async waitForConfirmations(blockNumber: number): Promise<void> {
    if (appConfig.baseConfirmations === 0) return;

    while (true) {
      const latest = await this.provider.getBlockNumber();
      if (latest - blockNumber >= appConfig.baseConfirmations) break;
      await sleep(appConfig.pollIntervalMs);
    }
  }

  async shutdown(): Promise<void> {
    this.running = false;
    this.contract.removeAllListeners();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    await this.polkadot.disconnect();

    if (this.provider instanceof WebSocketProvider) {
      await this.provider.destroy();
    }
  }
}

