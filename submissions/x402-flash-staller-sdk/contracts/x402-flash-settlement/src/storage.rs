use soroban_sdk::{Address, Env, Vec};
use crate::types::{Channel, DataKey, Settlement};

pub struct Storage;

impl Storage {
    pub fn get_channel(env: &Env, client: &Address, server: &Address) -> Option<Channel> {
        let key = DataKey::Channel(client.clone(), server.clone());
        env.storage().persistent().get(&key)
    }

    pub fn set_channel(env: &Env, client: &Address, server: &Address, channel: &Channel) {
        let key = DataKey::Channel(client.clone(), server.clone());
        env.storage().persistent().set(&key, channel);
        env.storage().persistent().extend_ttl(&key, 100000, 100000);
    }

    pub fn has_used_nonce(env: &Env, client: &Address, server: &Address, nonce: u64) -> bool {
        let key = DataKey::UsedNonce(client.clone(), server.clone(), nonce);
        env.storage().persistent().has(&key)
    }

    pub fn mark_nonce_used(env: &Env, client: &Address, server: &Address, nonce: u64) {
        let key = DataKey::UsedNonce(client.clone(), server.clone(), nonce);
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().extend_ttl(&key, 100000, 100000);
    }

    pub fn get_client_nonce(env: &Env, client: &Address) -> u64 {
        let key = DataKey::ClientNonce(client.clone());
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn increment_client_nonce(env: &Env, client: &Address) {
        let key = DataKey::ClientNonce(client.clone());
        let current = Self::get_client_nonce(env, client);
        env.storage().persistent().set(&key, &(current + 1));
        env.storage().persistent().extend_ttl(&key, 100000, 100000);
    }

    pub fn get_settlement_history(
        env: &Env,
        client: &Address,
        server: &Address,
    ) -> Vec<Settlement> {
        let key = DataKey::SettlementHistory(client.clone(), server.clone());
        env.storage().persistent().get(&key).unwrap_or(Vec::new(env))
    }

    pub fn add_settlement(
        env: &Env,
        client: &Address,
        server: &Address,
        settlement: Settlement,
    ) {
        let key = DataKey::SettlementHistory(client.clone(), server.clone());
        let mut history = Self::get_settlement_history(env, client, server);
        history.push_back(settlement);
        
        // Keep only last 100 settlements to save storage
        if history.len() > 100 {
            history.remove(0);
        }
        
        env.storage().persistent().set(&key, &history);
        env.storage().persistent().extend_ttl(&key, 100000, 100000);
    }

    pub fn get_minimum_payment(env: &Env, token: &Address) -> i128 {
        let key = DataKey::MinimumPayment(token.clone());
        env.storage().persistent().get(&key).unwrap_or(100) // Default: 100 stroops
    }

    pub fn set_minimum_payment(env: &Env, token: &Address, amount: i128) {
        let key = DataKey::MinimumPayment(token.clone());
        env.storage().persistent().set(&key, &amount);
    }

    pub fn get_admin(env: &Env) -> Address {
        let key = DataKey::Admin;
        env.storage().instance().get(&key).unwrap()
    }

    pub fn set_admin(env: &Env, admin: &Address) {
        let key = DataKey::Admin;
        env.storage().instance().set(&key, admin);
    }

    pub fn is_paused(env: &Env) -> bool {
        let key = DataKey::Paused;
        env.storage().instance().get(&key).unwrap_or(false)
    }

    pub fn set_paused(env: &Env, paused: bool) {
        let key = DataKey::Paused;
        env.storage().instance().set(&key, &paused);
    }
}
