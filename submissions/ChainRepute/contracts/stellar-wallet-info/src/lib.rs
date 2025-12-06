#![no_std]

use soroban_sdk::{contract, contractimpl, Env, String};

#[contract]
pub struct WalletInfo;

#[contractimpl]
impl WalletInfo {
    /// Returns basic information about a Stellar account
    pub fn get_account_info(_env: Env, account_id: String) -> (String, i128, u32) {
        // In a real implementation, this would fetch from the Stellar network
        // For now, we'll return mock data
        let balance = 100_0000000; // 100 XLM in stroops
        let sequence = 12345; // Account sequence number
        
        (account_id, balance, sequence)
    }
    
    /// Validates if a string is a valid Stellar public key
    pub fn is_valid_address(_env: Env, address: String) -> bool {
        // For now, just check the length
        // In a real implementation, we would add more validation
        address.len() == 56
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, String as S};

    #[test]
    fn test() {
        let env = Env::default();
        let contract_id = env.register_contract(None, WalletInfo);
        let client = WalletInfoClient::new(&env, &contract_id);
        
        // Using a valid test Stellar public key (testnet)
        let test_address = S::from_str(&env, "GAIH3BQDN6KJYDORUZKVXMS6E7GJQ5Z4KL5WPHYU67LHO6JNEBZJLSHX");
        
        // Test is_valid_address
        let is_valid = client.is_valid_address(&test_address);
        assert!(is_valid);
        
        // Test get_account_info
        let (address, balance, sequence) = client.get_account_info(&test_address);
        assert_eq!(address, test_address);
        assert!(balance > 0);
        assert!(sequence > 0);
    }
}