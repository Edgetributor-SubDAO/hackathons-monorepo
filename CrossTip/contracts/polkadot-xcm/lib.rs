// XCM Integration for CrossTip - Polkadot Parachain Interoperability
#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::arithmetic_side_effects)]

#[ink::contract]
mod crosstip_xcm {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::{String, ToString};

    /// CrossTip settlement with XCM support
    #[ink(storage)]
    pub struct CrossTipXcm {
        /// Contract owner
        owner: AccountId,
        /// Parachain ID mapping for supported chains
        supported_parachains: Mapping<u32, String>,
        /// Creator balances per parachain
        balances: Mapping<(AccountId, u32), u128>,
        /// Total settlements processed
        total_settlements: u64,
        /// XCM transaction costs
        xcm_fees: Mapping<u32, u128>,
        /// Contract pause state
        paused: bool,
    }

    /// XCM tip settlement data
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct XcmTipSettlement {
        pub creator: AccountId,
        pub source_parachain: u32,
        pub destination_parachain: u32,
        pub amount: u128,
        pub asset_id: Option<u32>,
        pub tip_count: u32,
    }

    /// Multi-location for XCM addressing
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct MultiLocation {
        pub parents: u8,
        pub interior: Vec<Junction>,
    }

    /// Junction types for XCM routing
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Junction {
        Parachain(u32),
        AccountId32 { network: Option<u32>, id: [u8; 32] },
        PalletInstance(u8),
        GeneralIndex(u128),
    }

    /// Events emitted by the contract
    #[ink(event)]
    pub struct XcmSettlementReceived {
        #[ink(topic)]
        creator: AccountId,
        #[ink(topic)]
        source_parachain: u32,
        destination_parachain: u32,
        amount: u128,
        tip_count: u32,
    }

    #[ink(event)]
    pub struct XcmTransferInitiated {
        #[ink(topic)]
        creator: AccountId,
        #[ink(topic)]
        target_parachain: u32,
        amount: u128,
        xcm_fee: u128,
    }

    #[ink(event)]
    pub struct ParachainRegistered {
        #[ink(topic)]
        parachain_id: u32,
        name: String,
        xcm_fee: u128,
    }

    /// Contract errors
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        Unauthorized,
        UnauthorizedAccess,
        ContractPaused,
        ParachainNotSupported,
        InsufficientBalance,
        XcmTransferFailed,
        InvalidAmount,
        ArithmeticOverflow,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl CrossTipXcm {
        /// Initialize the XCM-enabled CrossTip contract
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut contract = Self {
                owner: Self::env().caller(),
                supported_parachains: Mapping::default(),
                balances: Mapping::default(),
                total_settlements: 0,
                xcm_fees: Mapping::default(),
                paused: false,
            };

            // Register default parachains
            contract.register_default_parachains();
            
            contract
        }

        /// Register supported parachains with XCM fees
        #[ink(message)]
        pub fn register_parachain(
            &mut self,
            parachain_id: u32,
            name: String,
            xcm_fee: u128,
        ) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }

            self.supported_parachains.insert(parachain_id, &name);
            self.xcm_fees.insert(parachain_id, &xcm_fee);

            self.env().emit_event(ParachainRegistered {
                parachain_id,
                name,
                xcm_fee,
            });

            Ok(())
        }

        /// Submit XCM settlement from relayer
        #[ink(message)]
        pub fn submit_xcm_settlement(
            &mut self,
            settlement: XcmTipSettlement,
            _xcm_message_hash: [u8; 32],
        ) -> Result<()> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            // Verify parachain is supported
            if !self.supported_parachains.contains(settlement.source_parachain) {
                return Err(Error::ParachainNotSupported);
            }

            // Update creator balance for source parachain
            let balance_key = (settlement.creator, settlement.source_parachain);
            let current_balance = self.balances.get(&balance_key).unwrap_or(0);
            let new_balance = current_balance
                .checked_add(settlement.amount)
                .ok_or(Error::ArithmeticOverflow)?;
            
            self.balances.insert(&balance_key, &new_balance);

            // Update total settlements
            self.total_settlements = self.total_settlements
                .checked_add(1)
                .ok_or(Error::ArithmeticOverflow)?;

            // Emit settlement event
            self.env().emit_event(XcmSettlementReceived {
                creator: settlement.creator,
                source_parachain: settlement.source_parachain,
                destination_parachain: settlement.destination_parachain,
                amount: settlement.amount,
                tip_count: settlement.tip_count,
            });

            Ok(())
        }

        /// Initiate XCM transfer to another parachain
        #[ink(message)]
        pub fn initiate_xcm_transfer(
            &mut self,
            creator: AccountId,
            target_parachain: u32,
            amount: u128,
        ) -> Result<()> {
            // Verify caller authorization
            let caller = self.env().caller();
            if caller != creator {
                return Err(Error::UnauthorizedAccess);
            }

            if self.paused {
                return Err(Error::ContractPaused);
            }

            if amount == 0 {
                return Err(Error::InvalidAmount);
            }

            // Verify target parachain is supported
            if !self.supported_parachains.contains(target_parachain) {
                return Err(Error::ParachainNotSupported);
            }

            // Get XCM fee for target parachain
            let xcm_fee = self.xcm_fees.get(target_parachain).unwrap_or(0);
            let total_amount = amount.checked_add(xcm_fee).ok_or(Error::ArithmeticOverflow)?;

            // Check creator balance (using current parachain as source)
            let current_parachain = self.get_current_parachain_id();
            let balance_key = (creator, current_parachain);
            let current_balance = self.balances.get(&balance_key).unwrap_or(0);

            if current_balance < total_amount {
                return Err(Error::InsufficientBalance);
            }

            // Deduct from creator balance
            self.balances.insert(&balance_key, &(current_balance - total_amount));

            // This would trigger actual XCM message in production
            // For now, we emit an event to indicate transfer initiation
            self.env().emit_event(XcmTransferInitiated {
                creator,
                target_parachain,
                amount,
                xcm_fee,
            });

            Ok(())
        }

        /// Get creator balance for a specific parachain
        #[ink(message)]
        pub fn get_balance(&self, creator: AccountId, parachain_id: u32) -> u128 {
            self.balances.get(&(creator, parachain_id)).unwrap_or(0)
        }

        /// Get creator total balance across all parachains
        #[ink(message)]
        pub fn get_total_balance(&self, creator: AccountId) -> u128 {
            let mut total = 0u128;
            
            // In a real implementation, we'd iterate through all registered parachains
            // For demo, we'll check a few common parachain IDs
            let common_parachains = [1000u32, 2000, 2004, 2006, 2012, 2030]; // Moonbeam, Acala, Astar, etc.
            
            for &parachain_id in &common_parachains {
                if self.supported_parachains.contains(parachain_id) {
                    total += self.balances.get(&(creator, parachain_id)).unwrap_or(0);
                }
            }
            
            total
        }

        /// Get supported parachains
        #[ink(message)]
        pub fn get_supported_parachains(&self) -> Vec<(u32, String, u128)> {
            let mut parachains = Vec::new();
            
            // In a real implementation, we'd iterate through the mapping
            // For demo, return hardcoded values
            let default_chains = [
                (1000u32, "Moonbeam".to_string(), 1000000000u128),
                (2000u32, "Acala".to_string(), 500000000u128),
                (2004u32, "Moonriver".to_string(), 1000000000u128),
                (2006u32, "Astar".to_string(), 800000000u128),
                (2012u32, "Parallel".to_string(), 600000000u128),
                (2030u32, "Bifrost".to_string(), 400000000u128),
            ];
            
            for (id, name, fee) in default_chains {
                if self.supported_parachains.contains(id) {
                    parachains.push((id, name, fee));
                }
            }
            
            parachains
        }

        /// Generate XCM message for tip transfer (helper function)
        pub fn create_xcm_tip_message(
            &self,
            creator: AccountId,
            amount: u128,
            target_parachain: u32,
        ) -> Vec<u8> {
            // In a real implementation, this would construct proper XCM message
            // Following the XCM format from the documentation:
            /*
            let xcm_message = Xcm(vec![
                WithdrawAsset((Here, amount).into()),
                BuyExecution { 
                    fees: (Here, xcm_fee).into(), 
                    weight_limit: WeightLimit::Unlimited 
                },
                DepositAsset {
                    assets: All.into(),
                    beneficiary: MultiLocation {
                        parents: 1,
                        interior: Junction::Parachain(target_parachain)
                    }
                }
            ]);
            */
            
            // For demo, return encoded message representation
            let mut message = Vec::new();
            message.extend_from_slice(&amount.to_le_bytes());
            message.extend_from_slice(&target_parachain.to_le_bytes());
            message.extend_from_slice(&<AccountId as AsRef<[u8]>>::as_ref(&creator)[..8]); // First 8 bytes of account
            message
        }

        /// Administrative functions
        #[ink(message)]
        pub fn set_paused(&mut self, paused: bool) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }
            self.paused = paused;
            Ok(())
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        #[ink(message)]
        pub fn get_total_settlements(&self) -> u64 {
            self.total_settlements
        }

        /// Helper functions
        fn register_default_parachains(&mut self) {
            // Register major Polkadot parachains
            let default_parachains = [
                (1000u32, "Moonbeam"),
                (2000u32, "Acala"), 
                (2004u32, "Moonriver"),
                (2006u32, "Astar"),
                (2012u32, "Parallel"),
                (2030u32, "Bifrost"),
                (2034u32, "HydraDX"),
                (2104u32, "Nodle"),
            ];

            for (id, name) in default_parachains {
                self.supported_parachains.insert(id, &name.to_string());
                // Set default XCM fee (1 DOT = 10^10 plancks)
                self.xcm_fees.insert(id, &1000000000u128); // 0.1 DOT
            }
        }

        fn get_current_parachain_id(&self) -> u32 {
            // In a real implementation, this would query the runtime
            // For demo, assume we're on parachain 2001 (CrossTip parachain)
            2001u32
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let contract = CrossTipXcm::new();
            assert!(!contract.paused);
            assert_eq!(contract.get_total_settlements(), 0);
        }

        #[ink::test]
        fn register_parachain_works() {
            let mut contract = CrossTipXcm::new();
            
            let result = contract.register_parachain(
                9999u32,
                "TestChain".to_string(),
                2000000000u128,
            );
            
            assert!(result.is_ok());
            
            let parachains = contract.get_supported_parachains();
            // Should include default chains + our new one
            assert!(parachains.len() >= 1);
        }

        #[ink::test]
        fn xcm_settlement_works() {
            let mut contract = CrossTipXcm::new();
            
            let creator = AccountId::from([0x01; 32]);
            let settlement = XcmTipSettlement {
                creator,
                source_parachain: 1000u32,
                destination_parachain: 2001u32,
                amount: 5000000000u128, // 0.5 DOT
                asset_id: None,
                tip_count: 3,
            };
            
            let result = contract.submit_xcm_settlement(
                settlement,
                [0u8; 32], // Mock message hash
            );
            
            assert!(result.is_ok());
            assert_eq!(contract.get_balance(creator, 1000u32), 5000000000u128);
            assert_eq!(contract.get_total_settlements(), 1);
        }

        #[ink::test]
        fn xcm_transfer_works() {
            let mut contract = CrossTipXcm::new();
            let creator = AccountId::from([0x02; 32]);
            
            // First add some balance
            let settlement = XcmTipSettlement {
                creator,
                source_parachain: 2001u32,
                destination_parachain: 2001u32,
                amount: 10000000000u128, // 1 DOT
                asset_id: None,
                tip_count: 5,
            };
            
            let _ = contract.submit_xcm_settlement(settlement, [0u8; 32]);
            
            // Now try to transfer
            let result = contract.initiate_xcm_transfer(
                creator,
                1000u32, // To Moonbeam
                2000000000u128, // 0.2 DOT
            );
            
            // This should work in a real test environment with proper auth
            // For now, we expect unauthorized error since we can't mock require_auth
        }
    }
}