#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::arithmetic_side_effects)]

#[ink::contract]
mod settlement_contract {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;

    #[ink(storage)]
    pub struct SettlementContract {
        owner: AccountId,
        relayer_pubkey: Vec<u8>,
        balances: Mapping<Vec<u8>, u128>,
        total_settlements: u64,
        paused: bool,
    }

    #[ink(event)]
    pub struct SettlementReceived {
        #[ink(topic)]
        batch_id: Vec<u8>,
        creator_count: u32,
        total_amount: u128,
        batch_root: Vec<u8>,
    }

    #[ink(event)]
    pub struct BalanceUpdated {
        #[ink(topic)]
        creator: Vec<u8>,
        amount: u128,
        new_balance: u128,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        Unauthorized,
        InvalidSignature,
        ContractPaused,
        InvalidPayload,
        AlreadyProcessed,
        ArithmeticOverflow,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl SettlementContract {
        #[ink(constructor)]
        pub fn new(relayer_pubkey: Vec<u8>) -> Self {
            Self {
                owner: Self::env().caller(),
                relayer_pubkey,
                balances: Mapping::default(),
                total_settlements: 0,
                paused: false,
            }
        }

        /// Submit a settlement from the relayer
        #[ink(message)]
        pub fn submit_settlement(
            &mut self,
            settlement_bytes: Vec<u8>,
            signature: Vec<u8>,
        ) -> Result<()> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            // Verify signature
            if !self.verify_signature(&settlement_bytes, &signature) {
                return Err(Error::InvalidSignature);
            }

            // Parse settlement (simplified - in production use proper encoding)
            // Format: "creator_hex:amount" for demo
            let payload_str = core::str::from_utf8(&settlement_bytes)
                .map_err(|_| Error::InvalidPayload)?;
            
            let parts: Vec<&str> = payload_str.split(':').collect();
            if parts.len() < 2 {
                return Err(Error::InvalidPayload);
            }

            let creator_hex = parts[0];
            let amount: u128 = parts[1].parse().map_err(|_| Error::InvalidPayload)?;
            
            // Decode creator ID from hex
            let creator_bytes = self.hex_decode(creator_hex)?;

            // Update balance
            let current_balance = self.balances.get(&creator_bytes).unwrap_or(0);
            let new_balance = current_balance.checked_add(amount).ok_or(Error::ArithmeticOverflow)?;
            self.balances.insert(&creator_bytes, &new_balance);

            self.total_settlements = self.total_settlements.checked_add(1).ok_or(Error::ArithmeticOverflow)?;

            // Emit events
            self.env().emit_event(BalanceUpdated {
                creator: creator_bytes.clone(),
                amount,
                new_balance,
            });

            self.env().emit_event(SettlementReceived {
                batch_id: Vec::new(), // Simplified
                creator_count: 1,
                total_amount: amount,
                batch_root: Vec::new(),
            });

            Ok(())
        }

        /// Get creator balance
        #[ink(message)]
        pub fn get_balance(&self, creator: Vec<u8>) -> u128 {
            self.balances.get(&creator).unwrap_or(0)
        }

        /// Get total settlements processed
        #[ink(message)]
        pub fn get_total_settlements(&self) -> u64 {
            self.total_settlements
        }

        /// Update relayer public key (owner only)
        #[ink(message)]
        pub fn set_relayer_pubkey(&mut self, new_pubkey: Vec<u8>) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }
            self.relayer_pubkey = new_pubkey;
            Ok(())
        }

        /// Pause/unpause contract (owner only)
        #[ink(message)]
        pub fn set_paused(&mut self, paused: bool) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }
            self.paused = paused;
            Ok(())
        }

        /// Get contract owner
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        /// Get relayer public key
        #[ink(message)]
        pub fn get_relayer_pubkey(&self) -> Vec<u8> {
            self.relayer_pubkey.clone()
        }

        /// Verify ECDSA signature (simplified for demo)
        fn verify_signature(&self, _message: &[u8], _signature: &[u8]) -> bool {
            // In production, use proper ECDSA verification with ink_env::ecdsa_recover
            // For hackathon demo, we accept all signatures
            // TODO: Implement proper verification:
            /*
            use ink::env::hash::{Sha2x256, HashOutput};
            let mut output = <Sha2x256 as HashOutput>::Type::default();
            ink::env::hash_bytes::<Sha2x256>(message, &mut output);
            
            match ink::env::ecdsa_recover(signature, &output) {
                Ok(recovered_pubkey) => recovered_pubkey.as_ref() == self.relayer_pubkey.as_slice(),
                Err(_) => false,
            }
            */
            true // Simplified for demo
        }

        /// Helper to decode hex string
        fn hex_decode(&self, hex: &str) -> Result<Vec<u8>> {
            let hex = hex.trim_start_matches("0x");
            let mut bytes = Vec::new();
            
            for i in (0..hex.len()).step_by(2) {
                let next_i = i.checked_add(1).ok_or(Error::ArithmeticOverflow)?;
                if next_i < hex.len() {
                    let end_i = i.checked_add(2).ok_or(Error::ArithmeticOverflow)?;
                    let byte_str = &hex[i..end_i];
                    let byte = u8::from_str_radix(byte_str, 16)
                        .map_err(|_| Error::InvalidPayload)?;
                    bytes.push(byte);
                }
            }
            
            Ok(bytes)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let pubkey = vec![1, 2, 3, 4];
            let contract = SettlementContract::new(pubkey.clone());
            assert_eq!(contract.get_relayer_pubkey(), pubkey);
            assert_eq!(contract.get_total_settlements(), 0);
        }

        #[ink::test]
        fn submit_settlement_works() {
            let pubkey = vec![1, 2, 3, 4];
            let mut contract = SettlementContract::new(pubkey);
            
            let payload = b"abcd1234:1000000";
            let signature = vec![0; 64];
            
            let result = contract.submit_settlement(payload.to_vec(), signature);
            assert!(result.is_ok());
            assert_eq!(contract.get_total_settlements(), 1);
        }
    }
}
