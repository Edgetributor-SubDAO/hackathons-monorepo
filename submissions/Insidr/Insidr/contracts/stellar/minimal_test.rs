#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Counter,
    Owner,
}

#[contract]
pub struct MinimalTestContract;

#[contractimpl]
impl MinimalTestContract {
    pub fn initialize(env: Env, owner: Address) {
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Counter, &0u32);
    }

    pub fn increment(env: Env) -> u32 {
        let mut count: u32 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::Counter, &count);
        
        env.events().publish((symbol_short!("increment"),), count);
        count
    }

    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }
}

mod test;
