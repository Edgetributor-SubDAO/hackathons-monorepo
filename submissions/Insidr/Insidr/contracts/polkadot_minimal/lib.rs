#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod minimal_polkadot {
    #[ink(storage)]
    pub struct MinimalPolkadot {
        counter: u32,
        owner: AccountId,
    }

    #[ink(event)]
    pub struct Incremented {
        #[ink(topic)]
        value: u32,
    }

    impl MinimalPolkadot {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                counter: 0,
                owner: Self::env().caller(),
            }
        }

        #[ink(message)]
        pub fn increment(&mut self) -> u32 {
            self.counter = self.counter.saturating_add(1);
            self.env().emit_event(Incremented {
                value: self.counter,
            });
            self.counter
        }

        #[ink(message)]
        pub fn get_count(&self) -> u32 {
            self.counter
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }
    }
}
