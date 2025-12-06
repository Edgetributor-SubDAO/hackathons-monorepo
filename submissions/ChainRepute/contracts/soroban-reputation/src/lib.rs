#![no_std]
use soroban_sdk::{contractimpl, symbol, Env, Address, Vec};

pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn mint_credential(env: Env, user: Address, metadata_hash: Vec<u8>) {
        env.storage().set(&user, &metadata_hash);
    }

    pub fn update_credential(env: Env, user: Address, metadata_hash: Vec<u8>) {
        env.storage().set(&user, &metadata_hash);
    }

    pub fn get_credential(env: Env, user: Address) -> Option<Vec<u8>> {
        env.storage().get(&user)
    }

    pub fn revoke_credential(env: Env, user: Address) {
        env.storage().remove(&user);
    }
}
