// Simple Stellar Escrow Contract for Testnet
// Basic lock/unlock functionality without ZK verification for initial testing

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, Symbol,
};

#[contracttype]
#[derive(Clone, Debug)]
pub struct LockInfo {
    pub amount: i128,
    pub sender: Address,
    pub timestamp: u64,
    pub recipient_hash: BytesN<32>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    TokenContract,
    Lock(BytesN<32>),
    TotalLocked,
}

#[contract]
pub struct SimpleEscrow;

#[contractimpl]
impl SimpleEscrow {
    pub fn initialize(env: Env, admin: Address, token: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenContract, &token);
        env.storage().instance().set(&DataKey::TotalLocked, &0i128);
    }

    pub fn lock_funds(
        env: Env,
        sender: Address,
        amount: i128,
        lock_id: BytesN<32>,
        recipient_hash: BytesN<32>,
    ) {
        sender.require_auth();
        
        // Transfer tokens to contract
        let token_address: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        // Store lock info
        let lock_info = LockInfo {
            amount,
            sender: sender.clone(),
            timestamp: env.ledger().timestamp(),
            recipient_hash,
        };
        env.storage().instance().set(&DataKey::Lock(lock_id.clone()), &lock_info);

        // Update total locked
        let total: i128 = env.storage().instance().get(&DataKey::TotalLocked).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalLocked, &(total + amount));

        // Emit event
        env.events().publish((Symbol::new(&env, "lock"),), (lock_id, sender, amount));
    }

    pub fn unlock_funds(
        env: Env,
        lock_id: BytesN<32>,
        recipient: Address,
    ) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Get lock info
        let lock_info: LockInfo = env.storage().instance()
            .get(&DataKey::Lock(lock_id.clone()))
            .expect("Lock not found");

        // Transfer tokens
        let token_address: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &recipient, &lock_info.amount);

        // Remove lock
        env.storage().instance().remove(&DataKey::Lock(lock_id.clone()));

        // Update total locked
        let total: i128 = env.storage().instance().get(&DataKey::TotalLocked).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalLocked, &(total - lock_info.amount));

        // Emit event
        env.events().publish((Symbol::new(&env, "unlock"),), (lock_id, recipient, lock_info.amount));
    }

    pub fn get_lock_info(env: Env, lock_id: BytesN<32>) -> Option<LockInfo> {
        env.storage().instance().get(&DataKey::Lock(lock_id))
    }

    pub fn get_total_locked(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalLocked).unwrap_or(0)
    }
}
