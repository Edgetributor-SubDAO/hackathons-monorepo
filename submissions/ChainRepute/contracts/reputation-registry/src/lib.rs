#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Error};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationData {
    pub score: u32,
    pub profile: String,
    pub polkadot_address: String,
    pub timestamp: u64,
    pub verified: bool,
}

#[contract]
pub struct ReputationRegistry;

#[contractimpl]
impl ReputationRegistry {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&symbol_short!("admin"), &admin);
    }

    pub fn store_reputation(
        env: Env,
        user: Address,
        score: u32,
        profile: String,
        polkadot_address: String,
    ) -> Result<(), Error> {
        user.require_auth();
        if score > 1000 {
            return Err(Error::from_contract_error(2)); // InvalidScore
        }

        let reputation = ReputationData {
            score,
            profile,
            polkadot_address,
            timestamp: env.ledger().timestamp(),
            verified: true,
        };

        env.storage().persistent().set(&user, &reputation);
        env.events().publish(
            (symbol_short!("stored"), user.clone()),
            (score, env.ledger().timestamp()),
        );

        Ok(())
    }

    pub fn get_reputation(env: Env, user: Address) -> Option<ReputationData> {
        env.storage().persistent().get(&user)
    }

    pub fn update_score(env: Env, user: Address, new_score: u32) -> Result<(), Error> {
        user.require_auth();
        if new_score > 1000 {
            return Err(Error::from_contract_error(2)); // InvalidScore
        }

        let mut reputation: ReputationData = env
            .storage()
            .persistent()
            .get(&user)
            .ok_or_else(|| Error::from_contract_error(1))?; // NotFound

        let old_score = reputation.score;
        reputation.score = new_score;
        reputation.timestamp = env.ledger().timestamp();

        env.storage().persistent().set(&user, &reputation);
        env.events().publish(
            (symbol_short!("updated"), user.clone()),
            (old_score, new_score),
        );

        Ok(())
    }

    pub fn verify_credential(env: Env, user: Address) -> bool {
        match env.storage().persistent().get::<Address, ReputationData>(&user) {
            Some(data) => data.verified,
            None => false,
        }
    }
}