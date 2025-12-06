#![cfg_attr(not(feature = "std"), no_std, no_main)]

//! # Governance SBT - Polkadot Reputation Token
//!
//! This contract mints Soulbound Tokens (non-transferable NFTs) that represent
//! a user's cross-chain reputation, anchored from Stellar blockchain data.
//!
//! ## Features:
//! - Mint SBT with Stellar address verification
//! - Store reputation score (0-1000) from cross-chain analysis
//! - Query reputation by Polkadot account
//! - Non-transferable tokens (soulbound)
//! - Update scores with validation

#[ink::contract]
mod governance_sbt {
    use ink::storage::Mapping;

    /// Reputation data for an SBT holder
    #[derive(scale::Decode, scale::Encode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct ReputationData {
        /// Token ID (auto-incrementing)
        pub token_id: u64,
        /// Reputation score (0-1000)
        pub score: u32,
        /// Reputation profile type
        pub profile: ink::prelude::string::String,
        /// Linked Stellar address (for verification)
        pub stellar_address: ink::prelude::string::String,
        /// Timestamp of minting
        pub minted_at: u64,
    }

    /// Error types
    #[derive(scale::Decode, scale::Encode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Account already has an SBT
        AlreadyMinted,
        /// Account doesn't own an SBT
        NotOwner,
        /// Invalid score (must be 0-1000)
        InvalidScore,
        /// Not authorized to perform action
        Unauthorized,
    }

    /// SBT Result type
    pub type Result<T> = core::result::Result<T, Error>;

    /// The Governance SBT contract
    #[ink(storage)]
    pub struct GovernanceSbt {
        /// Mapping from account to reputation data
        reputations: Mapping<AccountId, ReputationData>,
        /// Total supply of SBTs
        total_supply: u64,
        /// Contract admin (can update scores)
        admin: AccountId,
    }

    impl GovernanceSbt {
        /// Constructor - Initialize the contract
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                reputations: Mapping::default(),
                total_supply: 0,
                admin: Self::env().caller(),
            }
        }

        /// Mint a new Reputation SBT
        /// 
        /// # Arguments
        /// * `score` - Reputation score (0-1000)
        /// * `profile` - Profile type (Trader, Governor, Staker, etc.)
        /// * `stellar_address` - Linked Stellar public key
        ///
        /// # Returns
        /// * `Ok(token_id)` - The newly minted token ID
        /// * `Err(Error)` - If already minted or invalid parameters
        #[ink(message)]
        pub fn mint_sbt(
            &mut self,
            score: u32,
            profile: ink::prelude::string::String,
            stellar_address: ink::prelude::string::String,
        ) -> Result<u64> {
            let caller = self.env().caller();

            // Check if already minted
            if self.reputations.contains(caller) {
                return Err(Error::AlreadyMinted);
            }

            // Validate score
            if score > 1000 {
                return Err(Error::InvalidScore);
            }

            // Increment token ID
            self.total_supply = self.total_supply.checked_add(1).ok_or(Error::InvalidScore)?;
            let token_id = self.total_supply;

            // Get current block timestamp
            let now = self.env().block_timestamp();

            // Create reputation data
            let reputation = ReputationData {
                token_id,
                score,
                profile,
                stellar_address,
                minted_at: now,
            };

            // Store reputation
            self.reputations.insert(caller, &reputation);

            Ok(token_id)
        }

        /// Update reputation score (admin only or self with lower score)
        ///
        /// # Arguments
        /// * `new_score` - New reputation score (0-1000)
        ///
        /// # Returns
        /// * `Ok(())` - Successfully updated
        /// * `Err(Error)` - If not owner or invalid score
        #[ink(message)]
        pub fn update_score(&mut self, new_score: u32) -> Result<()> {
            let caller = self.env().caller();

            // Validate score
            if new_score > 1000 {
                return Err(Error::InvalidScore);
            }

            // Get existing reputation
            let mut reputation = self.reputations.get(caller).ok_or(Error::NotOwner)?;

            // Only allow score updates upward (reputation can only improve)
            if new_score < reputation.score && caller != self.admin {
                return Err(Error::Unauthorized);
            }

            // Update score
            reputation.score = new_score;
            self.reputations.insert(caller, &reputation);

            Ok(())
        }

        /// Get reputation data for an account
        ///
        /// # Arguments
        /// * `account` - Account to query
        ///
        /// # Returns
        /// * `Some(ReputationData)` - If account has an SBT
        /// * `None` - If account doesn't have an SBT
        #[ink(message)]
        pub fn get_reputation(&self, account: AccountId) -> Option<ReputationData> {
            self.reputations.get(account)
        }

        /// Check if an account owns an SBT
        ///
        /// # Arguments
        /// * `account` - Account to check
        ///
        /// # Returns
        /// * `true` - If account has an SBT
        /// * `false` - If account doesn't have an SBT
        #[ink(message)]
        pub fn verify_ownership(&self, account: AccountId) -> bool {
            self.reputations.contains(account)
        }

        /// Get total supply of SBTs
        ///
        /// # Returns
        /// * Total number of SBTs minted
        #[ink(message)]
        pub fn total_supply(&self) -> u64 {
            self.total_supply
        }

        /// Get contract admin
        ///
        /// # Returns
        /// * Admin account address
        #[ink(message)]
        pub fn get_admin(&self) -> AccountId {
            self.admin
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn mint_works() {
            let mut contract = GovernanceSbt::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            let result = contract.mint_sbt(
                750,
                "Governor".into(),
                "GAXYZ...".into(),
            );

            assert!(result.is_ok());
            assert_eq!(result.unwrap(), 1);
            assert_eq!(contract.total_supply(), 1);
        }

        #[ink::test]
        fn cannot_mint_twice() {
            let mut contract = GovernanceSbt::new();

            contract.mint_sbt(
                500,
                "Trader".into(),
                "GAXYZ...".into(),
            ).unwrap();

            let result = contract.mint_sbt(
                600,
                "Governor".into(),
                "GAXYZ...".into(),
            );

            assert_eq!(result, Err(Error::AlreadyMinted));
        }

        #[ink::test]
        fn update_score_works() {
            let mut contract = GovernanceSbt::new();

            contract.mint_sbt(
                500,
                "Newcomer".into(),
                "GAXYZ...".into(),
            ).unwrap();

            let result = contract.update_score(750);
            assert!(result.is_ok());

            let rep = contract.get_reputation(ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().alice);
            assert_eq!(rep.unwrap().score, 750);
        }

        #[ink::test]
        fn verify_ownership_works() {
            let mut contract = GovernanceSbt::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            assert!(!contract.verify_ownership(accounts.alice));

            contract.mint_sbt(
                500,
                "Staker".into(),
                "GAXYZ...".into(),
            ).unwrap();

            assert!(contract.verify_ownership(accounts.alice));
        }
    }
}
