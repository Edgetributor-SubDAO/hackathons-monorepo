#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, 
    Address, Env, String, Vec, Val,
    symbol_short, xdr::{self, ScVal, ScAddress, ReadXdr, WriteXdr}
};
use stellar_xdr::{
    AccountId, PublicKey, LedgerKey, LedgerEntryData,
    ScVal as XdrScVal, ScAddress as XdrScAddress
};
use hex;
use core::convert::TryInto;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum WalletError {
    InvalidAddress = 1,
    AccountNotFound = 2,
    InvalidPublicKey = 3,
    DataCorrupted = 4,
}

/// Maximum length of a valid Stellar public key
const MAX_ADDRESS_LENGTH: usize = 56;

/// A contract for retrieving and validating Stellar wallet information
/// 
/// This contract provides functionality to:
/// - Validate Stellar addresses
/// - Fetch account details from the Stellar network
/// - Check account balances
/// - Verify account signers
/// - Get account sequence numbers
#[contract]
pub struct WalletInfo;

#[contractimpl]
impl WalletInfo {
    /// Retrieves detailed wallet information from the Stellar network
    /// 
    /// # Arguments
    /// * `env` - The environment the contract is running in
    /// * `wallet_address` - The Stellar wallet address (starts with 'G')
    /// 
    /// # Returns
    /// A tuple containing (address_string, sequence_number, timestamp, balance, num_sub_entries)
    pub fn get_wallet_info(env: Env, wallet_address: String) -> Result<(String, u64, u64, i64, u32), WalletError> {
        // Validate the address first
        if !Self::is_valid_address(env.clone(), wallet_address.clone())? {
            return Err(WalletError::InvalidAddress);
        }

        // Convert the address to an AccountId
        let account_id = Self::address_to_account_id(&wallet_address)?;
        
        // Get the account entry from the ledger
        let account_entry = Self::get_account_entry(&env, &account_id)?;
        
        // Extract the required information
        let sequence = account_entry.seq_num.0;
        let balance = account_entry.balance;
        let num_sub_entries = account_entry.num_sub_entries;
        let last_modified = account_entry.last_modified_ledger_seq;
        
        // Get current ledger timestamp
        let timestamp = env.ledger().timestamp();
        
        Ok((wallet_address, sequence, timestamp, balance, num_sub_entries))
    }

    /// Validates if the given string is a valid Stellar public key
    /// 
    /// # Arguments
    /// * `_env` - The environment the contract is running in
    /// * `address` - The address string to validate
    /// 
    /// # Returns
    /// `Result<bool, WalletError>` where `true` means valid address
    pub fn is_valid_address(_env: Env, address: String) -> Result<bool, WalletError> {
        if address.is_empty() || address.len() != MAX_ADDRESS_LENGTH || !address.starts_with('G') {
            return Ok(false);
        }
        
        // Additional validation can be added here, such as checksum verification
        // For now, we'll just check the basic format
        Ok(true)
    }
    
    /// Gets the current balance of a Stellar account
    /// 
    /// # Arguments
    /// * `env` - The environment
    /// * `wallet_address` - The Stellar wallet address
    /// 
    /// # Returns
    /// The account balance in stroops (1 XLM = 10,000,000 stroops)
    pub fn get_balance(env: Env, wallet_address: String) -> Result<i64, WalletError> {
        let account_id = Self::address_to_account_id(&wallet_address)?;
        let account_entry = Self::get_account_entry(&env, &account_id)?;
        Ok(account_entry.balance)
    }
    
    /// Gets the sequence number of a Stellar account
    /// 
    /// # Arguments
    /// * `env` - The environment
    /// * `wallet_address` - The Stellar wallet address
    /// 
    /// # Returns
    /// The current sequence number of the account
    pub fn get_sequence_number(env: Env, wallet_address: String) -> Result<u64, WalletError> {
        let account_id = Self::address_to_account_id(&wallet_address)?;
        let account_entry = Self::get_account_entry(&env, &account_id)?;
        Ok(account_entry.seq_num.0)
    }
    
    // ===== Helper Functions =====
    
    /// Converts a Stellar address string to an AccountId
    fn address_to_account_id(address: &str) -> Result<AccountId, WalletError> {
        // Decode the base58 address to bytes
        let decoded = match bs58::decode(address).into_vec() {
            Ok(bytes) => bytes,
            Err(_) => return Err(WalletError::InvalidAddress),
        };
        
        // The first byte is the version, the last 4 bytes are the checksum
        if decoded.len() < 5 {
            return Err(WalletError::InvalidAddress);
        }
        
        // The public key is everything in between (32 bytes)
        let public_key_bytes = &decoded[1..decoded.len() - 4];
        
        // Create a public key from the bytes
        let public_key = match PublicKey::from_binary_ed25519(public_key_bytes.try_into().map_err(|_| WalletError::InvalidPublicKey)?) {
            Ok(key) => key,
            Err(_) => return Err(WalletError::InvalidPublicKey),
        };
        
        Ok(AccountId(public_key))
    }
    
    /// Gets the account entry from the ledger
    fn get_account_entry(env: &Env, account_id: &AccountId) -> Result<stellar_xdr::AccountEntry, WalletError> {
        // Create a ledger key for the account
        let ledger_key = LedgerKey::Account(account_id.clone());
        
        // Convert the ledger key to XDR
        let ledger_key_xdr = ledger_key.to_xdr().map_err(|_| WalletError::DataCorrupted)?;
        
        // Convert XDR to ScVal
        let sc_val = ScVal::from_xdr(ledger_key_xdr).map_err(|_| WalletError::DataCorrupted)?;
        
        // Get the account entry from the ledger
        let ledger_entry = env.host()
            .get_ledger_entry(sc_val)
            .map_err(|_| WalletError::AccountNotFound)?;
        
        // Convert the account entry data back to XDR and then to AccountEntry
        let account_entry_xdr = ledger_entry.data.to_xdr().map_err(|_| WalletError::DataCorrupted)?;
        let account_entry = stellar_xdr::LedgerEntryData::from_xdr(account_entry_xdr)
            .map_err(|_| WalletError::DataCorrupted)?;
        
        match account_entry {
            stellar_xdr::LedgerEntryData::Account(account_entry) => Ok(account_entry),
            _ => Err(WalletError::DataCorrupted),
        }
    }
}
