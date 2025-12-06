import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  AssembledTransactionOptions,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCKCGYGFMTYRAHHNOVMBMGKAP6S4XSWL3TEJJH2D4JCZWBJRIZBUXZII",
  }
} as const

export const Errors = {
  1: {message:"ProjectNotFound"},
  2: {message:"InvalidMilestone"},
  3: {message:"AlreadyFunded"},
  4: {message:"NotFunded"},
  5: {message:"NotReleasable"},
  6: {message:"Unauthorized"}
}


export interface Project {
  client: string;
  freelancer: string;
  id: u64;
  milestones: Array<Milestone>;
  total_funded: i128;
  total_released: i128;
}


export interface Milestone {
  amount: i128;
  status: MilestoneStatus;
}

export type MilestoneStatus = {tag: "Pending", values: void} | {tag: "Funded", values: void} | {tag: "Submitted", values: void} | {tag: "Approved", values: void} | {tag: "Released", values: void};

export interface Client {
  /**
   * Construct and simulate a get_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get escrow balance (funded - released)
   */
  get_balance: ({project_id}: {project_id: u64}, options?: AssembledTransactionOptions<Result<i128>>) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_project transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get project details
   */
  get_project: ({project_id}: {project_id: u64}, options?: AssembledTransactionOptions<Result<Project>>) => Promise<AssembledTransaction<Result<Project>>>

  /**
   * Construct and simulate a create_project transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Creates a new escrow project with milestones
   * Returns the project ID
   */
  create_project: ({client, freelancer, milestone_amounts}: {client: string, freelancer: string, milestone_amounts: Array<i128>}, options?: AssembledTransactionOptions<u64>) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a fund_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Client funds a specific milestone
   * In production, this would transfer tokens to the contract
   */
  fund_milestone: ({project_id, milestone_index}: {project_id: u64, milestone_index: u32}, options?: AssembledTransactionOptions<Result<i128>>) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a submit_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Freelancer marks milestone as submitted (work done)
   */
  submit_milestone: ({project_id, milestone_index}: {project_id: u64, milestone_index: u32}, options?: AssembledTransactionOptions<Result<void>>) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_project_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get project count
   */
  get_project_count: (options?: AssembledTransactionOptions<u64>) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a release_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Client approves milestone and releases funds to freelancer
   */
  release_milestone: ({project_id, milestone_index}: {project_id: u64, milestone_index: u32}, options?: AssembledTransactionOptions<Result<i128>>) => Promise<AssembledTransaction<Result<i128>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABgAAAAAAAAAPUHJvamVjdE5vdEZvdW5kAAAAAAEAAAAAAAAAEEludmFsaWRNaWxlc3RvbmUAAAACAAAAAAAAAA1BbHJlYWR5RnVuZGVkAAAAAAAAAwAAAAAAAAAJTm90RnVuZGVkAAAAAAAABAAAAAAAAAANTm90UmVsZWFzYWJsZQAAAAAAAAUAAAAAAAAADFVuYXV0aG9yaXplZAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAAB1Byb2plY3QAAAAABgAAAAAAAAAGY2xpZW50AAAAAAATAAAAAAAAAApmcmVlbGFuY2VyAAAAAAATAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAKbWlsZXN0b25lcwAAAAAD6gAAB9AAAAAJTWlsZXN0b25lAAAAAAAAAAAAAAx0b3RhbF9mdW5kZWQAAAALAAAAAAAAAA50b3RhbF9yZWxlYXNlZAAAAAAACw==",
        "AAAAAAAAACZHZXQgZXNjcm93IGJhbGFuY2UgKGZ1bmRlZCAtIHJlbGVhc2VkKQAAAAAAC2dldF9iYWxhbmNlAAAAAAEAAAAAAAAACnByb2plY3RfaWQAAAAAAAYAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAABNHZXQgcHJvamVjdCBkZXRhaWxzAAAAAAtnZXRfcHJvamVjdAAAAAABAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAGAAAAAQAAA+kAAAfQAAAAB1Byb2plY3QAAAAAAw==",
        "AAAAAQAAAAAAAAAAAAAACU1pbGVzdG9uZQAAAAAAAAIAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAD01pbGVzdG9uZVN0YXR1cwA=",
        "AAAAAAAAAENDcmVhdGVzIGEgbmV3IGVzY3JvdyBwcm9qZWN0IHdpdGggbWlsZXN0b25lcwpSZXR1cm5zIHRoZSBwcm9qZWN0IElEAAAAAA5jcmVhdGVfcHJvamVjdAAAAAAAAwAAAAAAAAAGY2xpZW50AAAAAAATAAAAAAAAAApmcmVlbGFuY2VyAAAAAAATAAAAAAAAABFtaWxlc3RvbmVfYW1vdW50cwAAAAAAA+oAAAALAAAAAQAAAAY=",
        "AAAAAAAAAFtDbGllbnQgZnVuZHMgYSBzcGVjaWZpYyBtaWxlc3RvbmUKSW4gcHJvZHVjdGlvbiwgdGhpcyB3b3VsZCB0cmFuc2ZlciB0b2tlbnMgdG8gdGhlIGNvbnRyYWN0AAAAAA5mdW5kX21pbGVzdG9uZQAAAAAAAgAAAAAAAAAKcHJvamVjdF9pZAAAAAAABgAAAAAAAAAPbWlsZXN0b25lX2luZGV4AAAAAAQAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAADNGcmVlbGFuY2VyIG1hcmtzIG1pbGVzdG9uZSBhcyBzdWJtaXR0ZWQgKHdvcmsgZG9uZSkAAAAAEHN1Ym1pdF9taWxlc3RvbmUAAAACAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAGAAAAAAAAAA9taWxlc3RvbmVfaW5kZXgAAAAABAAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAABFHZXQgcHJvamVjdCBjb3VudAAAAAAAABFnZXRfcHJvamVjdF9jb3VudAAAAAAAAAAAAAABAAAABg==",
        "AAAAAAAAADpDbGllbnQgYXBwcm92ZXMgbWlsZXN0b25lIGFuZCByZWxlYXNlcyBmdW5kcyB0byBmcmVlbGFuY2VyAAAAAAARcmVsZWFzZV9taWxlc3RvbmUAAAAAAAACAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAGAAAAAAAAAA9taWxlc3RvbmVfaW5kZXgAAAAABAAAAAEAAAPpAAAACwAAAAM=",
        "AAAAAgAAAAAAAAAAAAAAD01pbGVzdG9uZVN0YXR1cwAAAAAFAAAAAAAAAAAAAAAHUGVuZGluZwAAAAAAAAAAAAAAAAZGdW5kZWQAAAAAAAAAAAAAAAAACVN1Ym1pdHRlZAAAAAAAAAAAAAAAAAAACEFwcHJvdmVkAAAAAAAAAAAAAAAIUmVsZWFzZWQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_balance: this.txFromJSON<Result<i128>>,
        get_project: this.txFromJSON<Result<Project>>,
        create_project: this.txFromJSON<u64>,
        fund_milestone: this.txFromJSON<Result<i128>>,
        submit_milestone: this.txFromJSON<Result<void>>,
        get_project_count: this.txFromJSON<u64>,
        release_milestone: this.txFromJSON<Result<i128>>
  }
}