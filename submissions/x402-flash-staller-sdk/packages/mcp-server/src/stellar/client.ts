import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';
import { Config } from '../config.js';
import { Transaction } from '../types.js';

export class StellarClient {
  private server: SorobanRpc.Server;
  private keypair: Keypair;
  private config: Config;
  private contract: Contract;

  constructor(config: Config) {
    this.config = config;
    this.server = new SorobanRpc.Server(config.stellar.rpcUrl);
    this.keypair = Keypair.fromSecret(config.wallet.secretKey);
    this.contract = new Contract(config.contracts.x402Flash);
  }

  getPublicKey(): string {
    return this.keypair.publicKey();
  }

  async getBalance(): Promise<string> {
    try {
      const account = await this.server.getAccount(this.keypair.publicKey());
      const balances: any = (account as any).balances;
      const nativeBalance = balances?.find(
        (b: any) => b.asset_type === 'native'
      );
      return nativeBalance?.balance || '0';
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async openChannel(
    server: string,
    token: string,
    amount: string,
    ttlSeconds: number
  ): Promise<Transaction> {
    const account = await this.server.getAccount(this.keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: this.config.stellar.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'open_escrow',
          nativeToScVal(Address.fromString(this.keypair.publicKey()), { type: 'address' }),
          nativeToScVal(Address.fromString(server), { type: 'address' }),
          nativeToScVal(Address.fromString(token), { type: 'address' }),
          nativeToScVal(BigInt(amount), { type: 'i128' }),
          nativeToScVal(ttlSeconds, { type: 'u64' })
        )
      )
      .setTimeout(30)
      .build();

    tx.sign(this.keypair);

    const response = await this.server.sendTransaction(tx);
    
    // Wait for confirmation
    let txResponse = await this.server.getTransaction(response.hash);
    let attempts = 0;
    while (txResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      txResponse = await this.server.getTransaction(response.hash);
      attempts++;
    }

    return {
      hash: response.hash,
      type: 'open_channel',
      amount,
      from: this.keypair.publicKey(),
      to: server,
      timestamp: Date.now(),
      status: txResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS ? 'success' : 'failed',
    };
  }

  async closeChannel(server: string): Promise<Transaction> {
    const account = await this.server.getAccount(this.keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: this.config.stellar.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'client_close_escrow',
          nativeToScVal(Address.fromString(this.keypair.publicKey()), { type: 'address' }),
          nativeToScVal(Address.fromString(server), { type: 'address' })
        )
      )
      .setTimeout(30)
      .build();

    tx.sign(this.keypair);

    const response = await this.server.sendTransaction(tx);

    return {
      hash: response.hash,
      type: 'close_channel',
      from: this.keypair.publicKey(),
      to: server,
      timestamp: Date.now(),
      status: 'pending',
    };
  }

  async getChannelBalance(server: string): Promise<string> {
    const account = await this.server.getAccount(this.keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: this.config.stellar.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          'current_escrow',
          nativeToScVal(Address.fromString(this.keypair.publicKey()), { type: 'address' }),
          nativeToScVal(Address.fromString(server), { type: 'address' })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await this.server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      return result?.toString() || '0';
    }

    return '0';
  }

  async sendPayment(
    agentEndpoint: string,
    capability: string,
    input: any,
    parameters?: any
  ): Promise<any> {
    // Get agent metadata
    const metadataResponse = await fetch(`${agentEndpoint}/metadata`);
    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch agent metadata');
    }
    const metadata: any = await metadataResponse.json();

    // Create payment authorization
    const nonce = Date.now();
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    const auth = {
      settlementContract: this.config.contracts.x402Flash,
      client: this.keypair.publicKey(),
      server: metadata.author.address,
      token: metadata.pricing.currency,
      amount: metadata.pricing.basePrice,
      nonce,
      deadline,
    };

    // Sign authorization
    const message = JSON.stringify(auth);
    const messageHash = Buffer.from(message);
    const signature = this.keypair.sign(messageHash);

    // Create payment payload
    const paymentPayload = {
      x402Version: 1,
      scheme: 'flash',
      network: 'stellar-testnet',
      payload: {
        auth,
        signature: signature.toString('hex'),
        publicKey: this.keypair.publicKey(),
      },
    };

    // Make request with X-Payment header
    const response = await fetch(`${agentEndpoint}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': Buffer.from(JSON.stringify(paymentPayload)).toString('base64'),
      },
      body: JSON.stringify({
        capability,
        input,
        parameters,
        userId: this.keypair.publicKey(),
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error?.message || 'Agent call failed');
    }

    return response.json();
  }

  async getTransaction(hash: string): Promise<any> {
    const txResponse = await this.server.getTransaction(hash);
    return txResponse;
  }
}
