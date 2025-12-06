/**
 * Escrow Contract Client
 * Uses the generated TypeScript bindings from stellar contract bindings
 */
import { Client, networks } from '../../packages/escrow/src';
import { TransactionBuilder, scValToNative } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';
import freighterApi from '@stellar/freighter-api';

const RPC_URL = 'https://soroban-testnet.stellar.org';

// Create RPC server instance
let rpcServer: Server | null = null;
function getServer(): Server {
  if (!rpcServer) {
    rpcServer = new Server(RPC_URL);
  }
  return rpcServer;
}

// Create a client instance for a specific public key
export function getEscrowClient(publicKey: string): Client {
  return new Client({
    ...networks.testnet,
    rpcUrl: RPC_URL,
    publicKey: publicKey,
  });
}

/**
 * Create a new escrow project
 */
export async function createProject(
  clientAddress: string,
  freelancerAddress: string,
  milestoneAmounts: bigint[]
): Promise<{ success: boolean; projectId?: number; txHash?: string; error?: string }> {
  try {
    console.log('Creating project with generated client...');
    console.log('Client address:', clientAddress);
    console.log('Freelancer address:', freelancerAddress);
    console.log('Milestone amounts:', milestoneAmounts.map(String));
    
    const client = getEscrowClient(clientAddress);
    
    // Build the transaction
    const tx = await client.create_project({
      client: clientAddress,
      freelancer: freelancerAddress,
      milestone_amounts: milestoneAmounts,
    });
    
    console.log('Transaction built, requesting signature...');
    
    // Get the XDR to sign
    const xdrToSign = tx.built!.toXDR();
    console.log('XDR to sign length:', xdrToSign.length);
    
    // Sign with Freighter
    const { signedTxXdr } = await freighterApi.signTransaction(xdrToSign, {
      networkPassphrase: networks.testnet.networkPassphrase,
    });
    console.log('Got signed XDR');
    
    // Submit directly using RPC server
    const server = getServer();
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networks.testnet.networkPassphrase);
    
    console.log('Submitting transaction...');
    const sendResult = await server.sendTransaction(signedTx);
    console.log('Send result:', sendResult);
    
    if (sendResult.status === 'PENDING') {
      // Wait for confirmation
      console.log('Transaction pending, waiting...');
      let getResult = await server.getTransaction(sendResult.hash);
      let attempts = 0;
      while (getResult.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await server.getTransaction(sendResult.hash);
        attempts++;
        console.log(`Attempt ${attempts}: ${getResult.status}`);
      }
      
      console.log('Final result:', getResult);
      
      if (getResult.status === 'SUCCESS') {
        // Try to extract project ID from return value
        let projectId = 1;
        try {
          if (getResult.returnValue) {
            projectId = Number(scValToNative(getResult.returnValue));
            console.log('Parsed project ID:', projectId);
          }
        } catch (e) {
          console.log('Could not parse return value, using default');
        }
        return { success: true, projectId, txHash: sendResult.hash };
      } else {
        return { success: false, error: `Transaction failed: ${getResult.status}` };
      }
    } else if (sendResult.status === 'ERROR') {
      return { success: false, error: `Send error: ${JSON.stringify(sendResult)}` };
    }
    
    return { success: false, error: `Unexpected status: ${sendResult.status}` };
  } catch (err: any) {
    console.error('Create project error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fund a milestone
 */
export async function fundMilestone(
  signerAddress: string,
  projectId: number,
  milestoneIndex: number
): Promise<{ success: boolean; amount?: number; txHash?: string; error?: string }> {
  try {
    console.log(`Funding milestone ${milestoneIndex} of project ${projectId}...`);
    
    const client = getEscrowClient(signerAddress);
    
    const tx = await client.fund_milestone({
      project_id: BigInt(projectId),
      milestone_index: milestoneIndex,
    });
    
    console.log('Transaction built, requesting signature...');
    
    // Get the XDR to sign
    const xdrToSign = tx.built!.toXDR();
    
    // Sign with Freighter
    const { signedTxXdr } = await freighterApi.signTransaction(xdrToSign, {
      networkPassphrase: networks.testnet.networkPassphrase,
    });
    console.log('Got signed XDR');
    
    // Submit directly using RPC server
    const server = getServer();
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networks.testnet.networkPassphrase);
    
    console.log('Submitting transaction...');
    const sendResult = await server.sendTransaction(signedTx);
    console.log('Send result:', sendResult);
    
    if (sendResult.status === 'PENDING') {
      // Wait for confirmation
      let getResult = await server.getTransaction(sendResult.hash);
      let attempts = 0;
      while (getResult.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await server.getTransaction(sendResult.hash);
        attempts++;
      }
      
      if (getResult.status === 'SUCCESS') {
        let amount = 0;
        try {
          if (getResult.returnValue) {
            const parsed = scValToNative(getResult.returnValue);
            // Result type: unwrap Ok
            if (parsed && typeof parsed === 'object' && 'Ok' in parsed) {
              amount = Number(parsed.Ok);
            } else {
              amount = Number(parsed);
            }
          }
        } catch (e) {
          console.log('Could not parse return value');
        }
        return { success: true, amount, txHash: sendResult.hash };
      } else {
        return { success: false, error: `Transaction failed: ${getResult.status}` };
      }
    }
    
    return { success: false, error: `Unexpected status: ${sendResult.status}` };
  } catch (err: any) {
    console.error('Fund milestone error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Submit a milestone (freelancer action)
 */
export async function submitMilestone(
  signerAddress: string,
  projectId: number,
  milestoneIndex: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log(`Submitting milestone ${milestoneIndex} of project ${projectId}...`);
    
    const client = getEscrowClient(signerAddress);
    
    const tx = await client.submit_milestone({
      project_id: BigInt(projectId),
      milestone_index: milestoneIndex,
    });
    
    console.log('Transaction built, requesting signature...');
    
    // Get the XDR to sign
    const xdrToSign = tx.built!.toXDR();
    
    // Sign with Freighter
    const { signedTxXdr } = await freighterApi.signTransaction(xdrToSign, {
      networkPassphrase: networks.testnet.networkPassphrase,
    });
    console.log('Got signed XDR');
    
    // Submit directly using RPC server
    const server = getServer();
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networks.testnet.networkPassphrase);
    
    console.log('Submitting transaction...');
    const sendResult = await server.sendTransaction(signedTx);
    console.log('Send result:', sendResult);
    
    if (sendResult.status === 'PENDING') {
      // Wait for confirmation
      let getResult = await server.getTransaction(sendResult.hash);
      let attempts = 0;
      while (getResult.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await server.getTransaction(sendResult.hash);
        attempts++;
      }
      
      if (getResult.status === 'SUCCESS') {
        return { success: true, txHash: sendResult.hash };
      } else {
        return { success: false, error: `Transaction failed: ${getResult.status}` };
      }
    }
    
    return { success: false, error: `Unexpected status: ${sendResult.status}` };
  } catch (err: any) {
    console.error('Submit milestone error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Release a milestone (client action)
 */
export async function releaseMilestone(
  signerAddress: string,
  projectId: number,
  milestoneIndex: number
): Promise<{ success: boolean; amount?: number; txHash?: string; error?: string }> {
  try {
    console.log(`Releasing milestone ${milestoneIndex} of project ${projectId}...`);
    
    const client = getEscrowClient(signerAddress);
    
    const tx = await client.release_milestone({
      project_id: BigInt(projectId),
      milestone_index: milestoneIndex,
    });
    
    console.log('Transaction built, requesting signature...');
    
    // Get the XDR to sign
    const xdrToSign = tx.built!.toXDR();
    
    // Sign with Freighter
    const { signedTxXdr } = await freighterApi.signTransaction(xdrToSign, {
      networkPassphrase: networks.testnet.networkPassphrase,
    });
    console.log('Got signed XDR');
    
    // Submit directly using RPC server
    const server = getServer();
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networks.testnet.networkPassphrase);
    
    console.log('Submitting transaction...');
    const sendResult = await server.sendTransaction(signedTx);
    console.log('Send result:', sendResult);
    
    if (sendResult.status === 'PENDING') {
      // Wait for confirmation
      let getResult = await server.getTransaction(sendResult.hash);
      let attempts = 0;
      while (getResult.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResult = await server.getTransaction(sendResult.hash);
        attempts++;
      }
      
      if (getResult.status === 'SUCCESS') {
        let amount = 0;
        try {
          if (getResult.returnValue) {
            const parsed = scValToNative(getResult.returnValue);
            // Result type: unwrap Ok
            if (parsed && typeof parsed === 'object' && 'Ok' in parsed) {
              amount = Number(parsed.Ok);
            } else {
              amount = Number(parsed);
            }
          }
        } catch (e) {
          console.log('Could not parse return value');
        }
        return { success: true, amount, txHash: sendResult.hash };
      } else {
        return { success: false, error: `Transaction failed: ${getResult.status}` };
      }
    }
    
    return { success: false, error: `Unexpected status: ${sendResult.status}` };
  } catch (err: any) {
    console.error('Release milestone error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Get project details (read-only) - uses a dummy address since no signing needed
 */
export async function getProject(projectId: number): Promise<any> {
  try {
    console.log(`Fetching project ${projectId}...`);
    
    // For read-only, we can use any valid address format
    const client = getEscrowClient('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const tx = await client.get_project({
      project_id: BigInt(projectId),
    });
    
    console.log(`Project ${projectId} tx object keys:`, Object.keys(tx));
    console.log(`Project ${projectId} tx.result:`, tx.result);
    console.log(`Project ${projectId} tx.simulation:`, (tx as any).simulation);
    
    // Try to get result from simulation if available
    const simulation = (tx as any).simulation;
    if (simulation?.result?.retval) {
      console.log(`Project ${projectId} retval:`, simulation.result.retval);
      try {
        const parsed = scValToNative(simulation.result.retval);
        console.log(`Project ${projectId} parsed from retval:`, parsed);
        
        // Handle Result type
        if (parsed && typeof parsed === 'object') {
          if ('Ok' in parsed) {
            console.log(`Project ${projectId} Ok value:`, parsed.Ok);
            return parsed.Ok;
          }
          if (parsed.client || parsed.freelancer) {
            return parsed;
          }
        }
        return parsed;
      } catch (e) {
        console.log(`Project ${projectId} retval parse error:`, e);
      }
    }
    
    // Fallback to tx.result
    console.log(`Project ${projectId} result type:`, typeof tx.result);
    console.log(`Project ${projectId} result keys:`, tx.result ? Object.keys(tx.result as any) : 'none');
    
    try {
      console.log(`Project ${projectId} JSON:`, JSON.stringify(tx.result, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    } catch (e) {
      console.log(`Project ${projectId} cannot stringify result`);
    }
    
    // Check the result structure
    if (tx.result === undefined || tx.result === null) {
      console.log(`Project ${projectId}: result is null/undefined`);
      return null;
    }
    
    // Handle Result type (Ok/Err) - could be {Ok: Project} or {tag: "Ok", values: Project}
    const result = tx.result as any;
    if (typeof result === 'object') {
      // Check for {Ok: value} format
      if ('Ok' in result) {
        console.log(`Project ${projectId} Ok:`, result.Ok);
        return result.Ok;
      }
      // Check for {tag: "Ok", values: value} format
      if (result.tag === 'Ok') {
        console.log(`Project ${projectId} tag Ok:`, result.values);
        return result.values;
      }
      if ('Err' in result) {
        console.log(`Project ${projectId} Err:`, result.Err);
        return null;
      }
      if (result.tag === 'Err') {
        console.log(`Project ${projectId} tag Err:`, result.values);
        return null;
      }
      // Maybe it's the project directly (has client, freelancer fields)
      if (result.client || result.freelancer || result.milestones) {
        console.log(`Project ${projectId} direct project object:`, result);
        return result;
      }
      console.log(`Project ${projectId} unknown object structure, returning as-is:`, result);
      return result;
    }
    
    return null;
  } catch (err: any) {
    console.error(`Get project ${projectId} error:`, err);
    return null;
  }
}

/**
 * Get project count (read-only)
 */
export async function getProjectCount(): Promise<number> {
  try {
    const client = getEscrowClient('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const tx = await client.get_project_count();
    
    return Number(tx.result);
  } catch (err: any) {
    console.error('Get project count error:', err);
    return 0;
  }
}
