import freighterApi from '@stellar/freighter-api';
import {
  Contract,
  TransactionBuilder,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
  Account,
  Networks,
} from '@stellar/stellar-sdk';
import { Server, Api, assembleTransaction } from '@stellar/stellar-sdk/rpc';
import { ESCROW_CONTRACT_ID, NETWORK_PASSPHRASE } from '../context/WalletContext';

console.log('escrow-contract.ts loaded');
console.log('Server:', typeof Server);
console.log('Api:', typeof Api);
console.log('Contract:', typeof Contract);

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

// Create server instance
let server: Server | null = null;

function getServer(): Server {
  if (!server) {
    server = new Server(SOROBAN_RPC_URL);
  }
  return server;
}

/**
 * Create a new escrow project
 */
export async function createProject(
  clientAddress: string,
  freelancerAddress: string,
  milestoneAmounts: number[]
): Promise<{ success: boolean; projectId?: number; error?: string }> {
  try {
    console.log('Getting account:', clientAddress);
    const rpcServer = getServer();
    
    // Get the account
    const account = await rpcServer.getAccount(clientAddress);
    console.log('Account loaded, sequence:', account.sequenceNumber());
    
    // Build the contract call
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    // Convert milestone amounts to i128 format
    const milestonesVec = milestoneAmounts.map(amount => 
      nativeToScVal(BigInt(amount), { type: 'i128' })
    );
    
    const operation = contract.call(
      'create_project',
      Address.fromString(clientAddress).toScVal(),
      Address.fromString(freelancerAddress).toScVal(),
      xdr.ScVal.scvVec(milestonesVec)
    );

    // Build the transaction
    const builtTx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Convert to XDR and back to ensure correct type
    const txXdr = builtTx.toXDR();
    console.log('Transaction XDR created');

    // Simulate first
    console.log('Simulating transaction...');
    const simulated = await rpcServer.simulateTransaction(builtTx);
    console.log('Simulation result:', simulated);
    
    if (Api.isSimulationError(simulated)) {
      console.error('Simulation error:', simulated);
      return { success: false, error: `Simulation failed: ${JSON.stringify(simulated.error)}` };
    }

    // Manually add soroban data to transaction
    console.log('Preparing transaction...');
    const successSim = simulated as Api.SimulateTransactionSuccessResponse;
    
    // Calculate new fee
    const baseFee = parseInt(builtTx.fee);
    const resourceFee = successSim.minResourceFee ? parseInt(successSim.minResourceFee) : 0;
    const totalFee = (baseFee + resourceFee).toString();
    console.log('Fees - base:', baseFee, 'resource:', resourceFee, 'total:', totalFee);
    
    // Get auth from simulation result
    const auth = successSim.result?.auth || [];
    console.log('Auth entries:', auth.length);
    
    // Rebuild the operation with auth
    const opWithAuth = contract.call(
      'create_project',
      Address.fromString(clientAddress).toScVal(),
      Address.fromString(freelancerAddress).toScVal(),
      xdr.ScVal.scvVec(milestonesVec)
    );
    
    // Set auth on the operation if we have it
    if (auth.length > 0) {
      (opWithAuth as any).auth = auth;
    }
    
    // Re-fetch account to get fresh sequence number
    const freshAccount = await rpcServer.getAccount(clientAddress);
    console.log('Fresh account sequence:', freshAccount.sequenceNumber());
    
    // Build new transaction with soroban data
    const preparedTx = new TransactionBuilder(freshAccount, {
      fee: totalFee,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(opWithAuth)
      .setSorobanData(successSim.transactionData.build())
      .setTimeout(30)
      .build();
    
    console.log('Prepared transaction with auth');

    // Sign with Freighter
    console.log('Requesting Freighter signature...');
    const { signedTxXdr } = await freighterApi.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    console.log('Transaction signed');

    // Submit
    const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    console.log('Submitting transaction...');
    const result = await rpcServer.sendTransaction(tx);
    console.log('Send result:', result);

    // Wait for confirmation
    if (result.status === 'PENDING') {
      console.log('Transaction pending, waiting for confirmation...');
      let getResult = await rpcServer.getTransaction(result.hash);
      let attempts = 0;
      while (getResult.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await rpcServer.getTransaction(result.hash);
        attempts++;
        console.log(`Attempt ${attempts}: ${getResult.status}`);
      }
      
      console.log('Final transaction result:', getResult);
      
      if (getResult.status === 'SUCCESS') {
        // Extract project ID from result
        const returnValue = getResult.returnValue;
        const projectId = returnValue ? Number(scValToNative(returnValue)) : 1;
        return { success: true, projectId };
      } else if (getResult.status === 'FAILED') {
        // Try to get error details
        const resultXdr = (getResult as any).resultXdr;
        const resultMetaXdr = (getResult as any).resultMetaXdr;
        console.error('Transaction FAILED');
        console.error('Result XDR:', resultXdr);
        console.error('Result Meta XDR:', resultMetaXdr);
        
        // Try to extract error code
        let errorMsg = 'Transaction failed on-chain';
        try {
          if (resultXdr && resultXdr.result) {
            const result = resultXdr.result();
            console.error('Decoded result:', result);
            errorMsg = `Failed: ${JSON.stringify(result)}`;
          }
        } catch (e) {
          console.error('Could not decode result:', e);
        }
        
        return { success: false, error: errorMsg };
      } else {
        return { success: false, error: `Transaction status: ${getResult.status}` };
      }
    } else if (result.status === 'ERROR') {
      console.error('Send error:', result);
      return { success: false, error: `Send error: ${(result as any).errorResult || result.status}` };
    }

    return { success: false, error: `Unexpected status: ${result.status}` };
  } catch (err: any) {
    console.error('Create project error:', err);
    // Better error extraction
    const errorMessage = err?.message || 
      err?.toString() || 
      (typeof err === 'object' ? JSON.stringify(err) : 'Unknown error');
    return { success: false, error: errorMessage };
  }
}

/**
 * Fund a milestone
 */
export async function fundMilestone(
  clientAddress: string,
  projectId: number,
  milestoneIndex: number
): Promise<{ success: boolean; amount?: number; error?: string }> {
  try {
    const rpcServer = getServer();
    const account = await rpcServer.getAccount(clientAddress);
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    const operation = contract.call(
      'fund_milestone',
      nativeToScVal(BigInt(projectId), { type: 'u64' }),
      nativeToScVal(milestoneIndex, { type: 'u32' })
    );

    const transaction = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await rpcServer.simulateTransaction(transaction);
    
    if (Api.isSimulationError(simulated)) {
      return { success: false, error: String(simulated.error) };
    }

    const prepared = assembleTransaction(transaction, simulated).build();
    const { signedTxXdr } = await freighterApi.signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await rpcServer.sendTransaction(tx);

    if (result.status === 'PENDING') {
      let getResult = await rpcServer.getTransaction(result.hash);
      while (getResult.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await rpcServer.getTransaction(result.hash);
      }
      
      if (getResult.status === 'SUCCESS') {
        const returnValue = getResult.returnValue;
        const amount = returnValue ? Number(scValToNative(returnValue)) : 0;
        return { success: true, amount };
      }
    }

    return { success: false, error: 'Transaction failed' };
  } catch (err: any) {
    console.error('Fund milestone error:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Submit a milestone (freelancer action)
 */
export async function submitMilestone(
  freelancerAddress: string,
  projectId: number,
  milestoneIndex: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const rpcServer = getServer();
    const account = await rpcServer.getAccount(freelancerAddress);
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    const operation = contract.call(
      'submit_milestone',
      nativeToScVal(BigInt(projectId), { type: 'u64' }),
      nativeToScVal(milestoneIndex, { type: 'u32' })
    );

    const transaction = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await rpcServer.simulateTransaction(transaction);
    
    if (Api.isSimulationError(simulated)) {
      return { success: false, error: String(simulated.error) };
    }

    const prepared = assembleTransaction(transaction, simulated).build();
    const { signedTxXdr } = await freighterApi.signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await rpcServer.sendTransaction(tx);

    if (result.status === 'PENDING') {
      let getResult = await rpcServer.getTransaction(result.hash);
      while (getResult.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await rpcServer.getTransaction(result.hash);
      }
      
      if (getResult.status === 'SUCCESS') {
        return { success: true };
      }
    }

    return { success: false, error: 'Transaction failed' };
  } catch (err: any) {
    console.error('Submit milestone error:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Release a milestone (client action)
 */
export async function releaseMilestone(
  clientAddress: string,
  projectId: number,
  milestoneIndex: number
): Promise<{ success: boolean; amount?: number; error?: string }> {
  try {
    const rpcServer = getServer();
    const account = await rpcServer.getAccount(clientAddress);
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    const operation = contract.call(
      'release_milestone',
      nativeToScVal(BigInt(projectId), { type: 'u64' }),
      nativeToScVal(milestoneIndex, { type: 'u32' })
    );

    const transaction = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await rpcServer.simulateTransaction(transaction);
    
    if (Api.isSimulationError(simulated)) {
      return { success: false, error: String(simulated.error) };
    }

    const prepared = assembleTransaction(transaction, simulated).build();
    const { signedTxXdr } = await freighterApi.signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await rpcServer.sendTransaction(tx);

    if (result.status === 'PENDING') {
      let getResult = await rpcServer.getTransaction(result.hash);
      while (getResult.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await rpcServer.getTransaction(result.hash);
      }
      
      if (getResult.status === 'SUCCESS') {
        const returnValue = getResult.returnValue;
        const amount = returnValue ? Number(scValToNative(returnValue)) : 0;
        return { success: true, amount };
      }
    }

    return { success: false, error: 'Transaction failed' };
  } catch (err: any) {
    console.error('Release milestone error:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Get project details
 */
export async function getProject(projectId: number): Promise<any> {
  try {
    const rpcServer = getServer();
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    // For read-only calls, we can simulate without signing
    const dummyAccount = new Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0'
    );
    
    const operation = contract.call(
      'get_project',
      nativeToScVal(BigInt(projectId), { type: 'u64' })
    );

    const transaction = new TransactionBuilder(dummyAccount, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await rpcServer.simulateTransaction(transaction);
    
    if (Api.isSimulationSuccess(simulated) && simulated.result) {
      return scValToNative(simulated.result.retval);
    }
    
    return null;
  } catch (err: any) {
    console.error('Get project error:', err);
    return null;
  }
}

/**
 * Get project count
 */
export async function getProjectCount(): Promise<number> {
  try {
    const rpcServer = getServer();
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    const dummyAccount = new Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0'
    );
    
    const operation = contract.call('get_project_count');

    const transaction = new TransactionBuilder(dummyAccount, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await rpcServer.simulateTransaction(transaction);
    
    if (Api.isSimulationSuccess(simulated) && simulated.result) {
      return Number(scValToNative(simulated.result.retval));
    }
    
    return 0;
  } catch (err: any) {
    console.error('Get project count error:', err);
    return 0;
  }
}
