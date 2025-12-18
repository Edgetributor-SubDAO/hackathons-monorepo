// src/lib.rs - Soroban Micro-Payout Contract for CrossTip
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, symbol_short};

#[derive(Clone)]
#[contracttype]
pub struct TipEvent {
    pub creator: Address,
    pub tipper: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contract]
pub struct MicroPayoutContract;

#[contractimpl]
impl MicroPayoutContract {
    /// Initialize the contract with an owner
    pub fn initialize(env: Env, owner: Address) {
        if env.storage().instance().has(&symbol_short!("OWNER")) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&symbol_short!("OWNER"), &owner);
        env.storage().instance().set(&symbol_short!("TIPS"), &0i128);
    }

    /// Send a tip to a creator
    pub fn tip(env: Env, tipper: Address, creator: Address, amount: i128) {
        // Validate
        tipper.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Update creator balance
        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&symbol_short!("BAL"))
            .unwrap_or(Map::new(&env));
        
        let current_balance = balances.get(creator.clone()).unwrap_or(0);
        balances.set(creator.clone(), current_balance + amount);
        env.storage().instance().set(&symbol_short!("BAL"), &balances);

        // Update total tips counter
        let total: i128 = env.storage().instance().get(&symbol_short!("TIPS")).unwrap_or(0);
        env.storage().instance().set(&symbol_short!("TIPS"), &(total + amount));

        // Emit event for relayer
        let event = TipEvent {
            creator: creator.clone(),
            tipper: tipper.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };
        
        env.events().publish((symbol_short!("TIP"), creator), event);
    }

    /// Withdraw balance (creator only)
    pub fn withdraw(env: Env, creator: Address, amount: i128) {
        creator.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&symbol_short!("BAL"))
            .unwrap_or(Map::new(&env));
        
        let current_balance = balances.get(creator.clone()).unwrap_or(0);
        
        if amount > current_balance {
            panic!("Insufficient balance");
        }

        balances.set(creator.clone(), current_balance - amount);
        env.storage().instance().set(&symbol_short!("BAL"), &balances);

        // Emit withdraw event for relayer to process
        env.events().publish(
            (symbol_short!("WITHDRAW"), creator.clone()),
            (creator, amount, env.ledger().timestamp())
        );
    }

    /// Get creator balance
    pub fn balance(env: Env, creator: Address) -> i128 {
        let balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&symbol_short!("BAL"))
            .unwrap_or(Map::new(&env));
        
        balances.get(creator).unwrap_or(0)
    }

    /// Get total tips processed
    pub fn total_tips(env: Env) -> i128 {
        env.storage().instance().get(&symbol_short!("TIPS")).unwrap_or(0)
    }

    /// Admin: Set new owner
    pub fn set_owner(env: Env, new_owner: Address) {
        let owner: Address = env.storage().instance().get(&symbol_short!("OWNER")).unwrap();
        owner.require_auth();
        env.storage().instance().set(&symbol_short!("OWNER"), &new_owner);
    }

    /// Get contract owner
    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("OWNER")).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MicroPayoutContract);
        let client = MicroPayoutContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        client.initialize(&owner);
        
        assert_eq!(client.get_owner(), owner);
        assert_eq!(client.total_tips(), 0);
    }

    #[test]
    fn test_tip_and_balance() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MicroPayoutContract);
        let client = MicroPayoutContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        let creator = Address::generate(&env);
        let tipper = Address::generate(&env);
        
        client.initialize(&owner);
        
        env.mock_all_auths();
        client.tip(&tipper, &creator, &100);
        
        assert_eq!(client.balance(&creator), 100);
        assert_eq!(client.total_tips(), 100);
    }

    #[test]
    fn test_withdraw() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MicroPayoutContract);
        let client = MicroPayoutContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        let creator = Address::generate(&env);
        let tipper = Address::generate(&env);
        
        client.initialize(&owner);
        
        env.mock_all_auths();
        client.tip(&tipper, &creator, &100);
        client.withdraw(&creator, &50);
        
        assert_eq!(client.balance(&creator), 50);
    }

    #[test]
    #[should_panic(expected = "Insufficient balance")]
    fn test_withdraw_insufficient() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MicroPayoutContract);
        let client = MicroPayoutContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        let creator = Address::generate(&env);
        
        client.initialize(&owner);
        
        env.mock_all_auths();
        client.withdraw(&creator, &100);
    }
}
