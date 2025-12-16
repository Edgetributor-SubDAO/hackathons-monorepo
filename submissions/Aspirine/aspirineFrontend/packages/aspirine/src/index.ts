import { Buffer } from "buffer";
import { 
  Address,
  Account,
  Asset,
  BASE_FEE,
  Contract,
  Keypair,
  Memo,
  MemoHash,
  MemoID,
  MemoNone,
  MemoReturn,
  MemoText,
  Networks,
  Operation,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
  xdr,
  scValToNative,
  nativeToScVal
} from '@stellar/stellar-sdk';
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

// Export commonly used stellar-sdk types and functions
export {
  Address,
  Account,
  Asset,
  BASE_FEE,
  Contract,
  Keypair,
  Memo,
  MemoHash,
  MemoID,
  MemoNone,
  MemoReturn,
  MemoText,
  Networks,
  Operation,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
  xdr,
  scValToNative,
  nativeToScVal
};

export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4",
  }
} as const

export type ProposalStatus = {tag: "Active", values: void} | {tag: "Approved", values: void} | {tag: "Rejected", values: void} | {tag: "Executed", values: void};


export interface Proposal {
  amount_requested: i128;
  created_at: u64;
  hospital: string;
  id: u64;
  patient_details: string;
  patient_name: string;
  status: ProposalStatus;
  votes_against: u32;
  votes_for: u32;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "ProposalCount", values: void} | {tag: "Proposal", values: readonly [u64]} | {tag: "Vote", values: readonly [u64, string]} | {tag: "VotingThreshold", values: void} | {tag: "Treasury", values: void} | {tag: "DAOMember", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the DAO with an admin and voting threshold
   * voting_threshold: minimum percentage of votes needed to approve (0-100)
   */
  initialize: ({admin, voting_threshold}: {admin: string, voting_threshold: u32}, options?: AssembledTransactionOptions<null>) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a member to the DAO (only admin can do this)
   */
  add_member: ({admin, member}: {admin: string, member: string}, options?: AssembledTransactionOptions<null>) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add funds to the DAO treasury
   */
  add_funds: ({amount}: {amount: i128}, options?: AssembledTransactionOptions<null>) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a submit_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a new proposal (only hospitals can do this)
   */
  submit_proposal: ({hospital, patient_name, patient_details, amount_requested}: {hospital: string, patient_name: string, patient_details: string, amount_requested: i128}, options?: AssembledTransactionOptions<u64>) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Vote on a proposal (only DAO members can vote)
   * approve: true to vote for, false to vote against
   */
  vote: ({voter, proposal_id, approve}: {voter: string, proposal_id: u64, approve: boolean}, options?: AssembledTransactionOptions<null>) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a finalize_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Finalize voting on a proposal to determine if it's approved or rejected
   */
  finalize_proposal: ({proposal_id}: {proposal_id: u64}, options?: AssembledTransactionOptions<null>) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a execute_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute an approved proposal and release funds
   */
  execute_proposal: ({proposal_id}: {proposal_id: u64}, options?: AssembledTransactionOptions<null>) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get proposal details by ID
   */
  get_proposal: ({proposal_id}: {proposal_id: u64}, options?: AssembledTransactionOptions<Proposal>) => Promise<AssembledTransaction<Proposal>>

  /**
   * Construct and simulate a get_proposal_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of proposals
   */
  get_proposal_count: (options?: AssembledTransactionOptions<u64>) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_treasury_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get treasury balance
   */
  get_treasury_balance: (options?: AssembledTransactionOptions<i128>) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a is_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if an address is a DAO member
   */
  is_member: ({address}: {address: string}, options?: AssembledTransactionOptions<boolean>) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a has_voted transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a voter has voted on a proposal
   */
  has_voted: ({proposal_id, voter}: {proposal_id: u64, voter: string}, options?: AssembledTransactionOptions<boolean>) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_voting_threshold transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get voting threshold
   */
  get_voting_threshold: (options?: AssembledTransactionOptions<u32>) => Promise<AssembledTransaction<u32>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAEAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAhBcHByb3ZlZAAAAAAAAAAAAAAACFJlamVjdGVkAAAAAAAAAAAAAAAIRXhlY3V0ZWQ=",
        "AAAAAQAAAAAAAAAAAAAACFByb3Bvc2FsAAAACQAAAAAAAAAQYW1vdW50X3JlcXVlc3RlZAAAAAsAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAACGhvc3BpdGFsAAAAEwAAAAAAAAACaWQAAAAAAAYAAAAAAAAAD3BhdGllbnRfZGV0YWlscwAAAAAQAAAAAAAAAAxwYXRpZW50X25hbWUAAAAQAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAOUHJvcG9zYWxTdGF0dXMAAAAAAAAAAAANdm90ZXNfYWdhaW5zdAAAAAAAAAQAAAAAAAAACXZvdGVzX2ZvcgAAAAAAAAQ=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAANUHJvcG9zYWxDb3VudAAAAAAAAAEAAAAAAAAACFByb3Bvc2FsAAAAAQAAAAYAAAABAAAAAAAAAARWb3RlAAAAAgAAAAYAAAATAAAAAAAAAAAAAAAPVm90aW5nVGhyZXNob2xkAAAAAAAAAAAAAAAACFRyZWFzdXJ5AAAAAQAAAAAAAAAJREFPTWVtYmVyAAAAAAAAAQAAABM=",
        "AAAAAAAAAH1Jbml0aWFsaXplIHRoZSBEQU8gd2l0aCBhbiBhZG1pbiBhbmQgdm90aW5nIHRocmVzaG9sZAp2b3RpbmdfdGhyZXNob2xkOiBtaW5pbXVtIHBlcmNlbnRhZ2Ugb2Ygdm90ZXMgbmVlZGVkIHRvIGFwcHJvdmUgKDAtMTAwKQAAAAAAAAppbml0aWFsaXplAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAEHZvdGluZ190aHJlc2hvbGQAAAAEAAAAAA==",
        "AAAAAAAAADBBZGQgYSBtZW1iZXIgdG8gdGhlIERBTyAob25seSBhZG1pbiBjYW4gZG8gdGhpcykAAAAKYWRkX21lbWJlcgAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZtZW1iZXIAAAAAABMAAAAA",
        "AAAAAAAAAB1BZGQgZnVuZHMgdG8gdGhlIERBTyB0cmVhc3VyeQAAAAAAAAlhZGRfZnVuZHMAAAAAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAADJTdWJtaXQgYSBuZXcgcHJvcG9zYWwgKG9ubHkgaG9zcGl0YWxzIGNhbiBkbyB0aGlzKQAAAAAAD3N1Ym1pdF9wcm9wb3NhbAAAAAAEAAAAAAAAAAhob3NwaXRhbAAAABMAAAAAAAAADHBhdGllbnRfbmFtZQAAABAAAAAAAAAAD3BhdGllbnRfZGV0YWlscwAAAAAQAAAAAAAAABBhbW91bnRfcmVxdWVzdGVkAAAACwAAAAEAAAAG",
        "AAAAAAAAAF9Wb3RlIG9uIGEgcHJvcG9zYWwgKG9ubHkgREFPIG1lbWJlcnMgY2FuIHZvdGUpCmFwcHJvdmU6IHRydWUgdG8gdm90ZSBmb3IsIGZhbHNlIHRvIHZvdGUgYWdhaW5zdAAAAAAEdm90ZQAAAAMAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAAAAAAHYXBwcm92ZQAAAAABAAAAAA==",
        "AAAAAAAAAEdGaW5hbGl6ZSB2b3Rpbmcgb24gYSBwcm9wb3NhbCB0byBkZXRlcm1pbmUgaWYgaXQncyBhcHByb3ZlZCBvciByZWplY3RlZAAAAAARZmluYWxpemVfcHJvcG9zYWwAAAAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAA==",
        "AAAAAAAAAC5FeGVjdXRlIGFuIGFwcHJvdmVkIHByb3Bvc2FsIGFuZCByZWxlYXNlIGZ1bmRzAAAAAAAQZXhlY3V0ZV9wcm9wb3NhbAAAAAEAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAYAAAAA",
        "AAAAAAAAABpHZXQgcHJvcG9zYWwgZGV0YWlscyBieSBJRAAAAAAADGdldF9wcm9wb3NhbAAAAAEAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAYAAAABAAAH0AAAAAhQcm9wb3NhbA==",
        "AAAAAAAAAB1HZXQgdG90YWwgbnVtYmVyIG9mIHByb3Bvc2FscwAAAAAAABJnZXRfcHJvcG9zYWxfY291bnQAAAAAAAAAAAABAAAABg==",
        "AAAAAAAAABRHZXQgdHJlYXN1cnkgYmFsYW5jZQAAABRnZXRfdHJlYXN1cnlfYmFsYW5jZQAAAAAAAAABAAAACw==",
        "AAAAAAAAACNDaGVjayBpZiBhbiBhZGRyZXNzIGlzIGEgREFPIG1lbWJlcgAAAAAJaXNfbWVtYmVyAAAAAAAAAQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAQAAAAE=",
        "AAAAAAAAAChDaGVjayBpZiBhIHZvdGVyIGhhcyB2b3RlZCBvbiBhIHByb3Bvc2FsAAAACWhhc192b3RlZAAAAAAAAAIAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAYAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAEAAAAB",
        "AAAAAAAAABRHZXQgdm90aW5nIHRocmVzaG9sZAAAABRnZXRfdm90aW5nX3RocmVzaG9sZAAAAAAAAAABAAAABA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        add_member: this.txFromJSON<null>,
        add_funds: this.txFromJSON<null>,
        submit_proposal: this.txFromJSON<u64>,
        vote: this.txFromJSON<null>,
        finalize_proposal: this.txFromJSON<null>,
        execute_proposal: this.txFromJSON<null>,
        get_proposal: this.txFromJSON<Proposal>,
        get_proposal_count: this.txFromJSON<u64>,
        get_treasury_balance: this.txFromJSON<i128>,
        is_member: this.txFromJSON<boolean>,
        has_voted: this.txFromJSON<boolean>,
        get_voting_threshold: this.txFromJSON<u32>
  }
}