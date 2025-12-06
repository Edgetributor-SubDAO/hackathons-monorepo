#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Error,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationData {
    pub score: u32,
    pub profile: String,
    pub stellar_address: String,
    pub minted_at: u64,
    pub token_id: u64,
}

#[contract]
pub struct ReputationSBT;

#[contractimpl]
impl ReputationSBT {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.storage().instance().set(&symbol_short!("supply"), &0u64);
    }

    pub fn mint_sbt(
        env: Env,
        to: Address,
        score: u32,
        profile: String,
        stellar_address: String,
    ) -> Result<u64, Error> {
        if score > 1000 {
            return Err(Error::from_contract_error(3)); // InvalidScore
        }

        let supply: u64 = env
            .storage()
            .instance()
            .get(&symbol_short!("supply"))
            .unwrap_or(0);
        
        let new_supply = supply.checked_add(1).ok_or(Error::from_contract_error(4))?; // Overflow

        let reputation = ReputationData {
            score,
            profile,
            stellar_address,
            minted_at: env.ledger().timestamp(),
            token_id: new_supply,
        };

        // Store the reputation data
        env.storage().persistent().set(&to, &reputation);
        
        // Update supply
        env.storage().instance().set(&symbol_short!("supply"), &new_supply);

        // Emit event
        env.events().publish(
            (symbol_short!("minted"), to.clone()),
            (new_supply, score),
        );

        Ok(new_supply)
    }

    pub fn get_reputation(env: Env, account: Address) -> Option<ReputationData> {
        env.storage().persistent().get(&account)
    }

    pub fn update_score(env: Env, caller: Address, new_score: u32) -> Result<(), Error> {
        if new_score > 1000 {
            return Err(Error::from_contract_error(3)); // InvalidScore
        }

        let mut reputation: ReputationData = env
            .storage()
            .persistent()
            .get(&caller)
            .ok_or_else(|| Error::from_contract_error(1))?; // NotFound

        let old_score = reputation.score;
        reputation.score = new_score;

        env.storage().persistent().set(&caller, &reputation);

        // Emit event
        env.events().publish(
            (symbol_short!("updated"), caller),
            (old_score, new_score),
        );

        Ok(())
    }

    pub fn verify_ownership(env: Env, account: Address) -> bool {
        env.storage().persistent().has(&account)
    }

    pub fn total_supply(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&symbol_short!("supply"))
            .unwrap_or(0)
    }
}