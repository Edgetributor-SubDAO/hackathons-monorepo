#![cfg_attr(not(feature = "std"), no_std, no_main)]

pub mod dropmate_escrow {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    #[ink::storage_struct]
    pub struct DropmateEscrow {
        /// Ride details storage
        rides: Mapping<String, Ride>,
        /// Active ride IDs
        active_rides: Vec<String>,
        /// Total rides created
        ride_count: u32,
        /// Contract owner
        owner: AccountId,
    }

    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Ride {
        id: String,
        customer: AccountId,
        driver: Option<AccountId>,
        pickup_lat: i32,
        pickup_lng: i32,
        dropoff_lat: i32,
        dropoff_lng: i32,
        estimated_fare: Balance,
        actual_fare: Balance,
        staked_amount: Balance,
        status: RideStatus,
        created_at: Timestamp,
        completed_at: Option<Timestamp>,
    }

    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum RideStatus {
        Waiting,
        Accepted,
        InProgress,
        Completed,
        Cancelled,
    }

    #[ink::event]
    pub struct RideCreated {
        #[ink(topic)]
        ride_id: String,
        #[ink(topic)]
        customer: AccountId,
        staked_amount: Balance,
    }

    #[ink::event]
    pub struct RideAccepted {
        #[ink(topic)]
        ride_id: String,
        #[ink(topic)]
        driver: AccountId,
    }

    #[ink::event]
    pub struct PaymentReleased {
        #[ink(topic)]
        ride_id: String,
        #[ink(topic)]
        driver: AccountId,
        amount_paid: Balance,
    }

    #[ink::event]
    pub struct PaymentRefunded {
        #[ink(topic)]
        ride_id: String,
        #[ink(topic)]
        customer: AccountId,
        refund_amount: Balance,
    }

    #[ink::contract]
    impl DropmateEscrow {
        /// Creates a new DropMate escrow contract
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                rides: Mapping::default(),
                active_rides: Vec::new(),
                ride_count: 0,
                owner: Self::env().caller(),
            }
        }

        /// Stake tokens for a ride (called by customer)
        #[ink(message, payable)]
        pub fn stake_for_ride(
            &mut self,
            ride_id: String,
            estimated_fare: Balance,
            pickup_lat: i32,
            pickup_lng: i32,
            dropoff_lat: i32,
            dropoff_lng: i32,
        ) -> Result<(), String> {
            let caller = self.env().caller();
            let transferred = self.env().transferred_value();

            if transferred == 0 {
                return Err("Must stake tokens".to_string());
            }

            let ride = Ride {
                id: ride_id.clone(),
                customer: caller,
                driver: None,
                pickup_lat,
                pickup_lng,
                dropoff_lat,
                dropoff_lng,
                estimated_fare,
                actual_fare: 0,
                staked_amount: transferred,
                status: RideStatus::Waiting,
                created_at: self.env().block_timestamp(),
                completed_at: None,
            };

            self.rides.insert(ride_id.clone(), &ride);
            self.active_rides.push(ride_id.clone());
            self.ride_count += 1;

            self.env().emit_event(RideCreated {
                ride_id,
                customer: caller,
                staked_amount: transferred,
            });

            Ok(())
        }

        /// Driver accepts a ride
        #[ink(message)]
        pub fn accept_ride(&mut self, ride_id: String, driver: AccountId) -> Result<(), String> {
            let mut ride = self.rides.get(&ride_id).ok_or("Ride not found")?;

            if ride.status != RideStatus::Waiting {
                return Err("Ride not in waiting state".to_string());
            }

            ride.driver = Some(driver);
            ride.status = RideStatus::Accepted;

            self.rides.insert(ride_id.clone(), &ride);

            self.env().emit_event(RideAccepted { ride_id, driver });

            Ok(())
        }

        /// Start the ride (driver picks up customer)
        #[ink(message)]
        pub fn start_ride(&mut self, ride_id: String) -> Result<(), String> {
            let mut ride = self.rides.get(&ride_id).ok_or("Ride not found")?;

            if ride.status != RideStatus::Accepted {
                return Err("Ride not accepted".to_string());
            }

            ride.status = RideStatus::InProgress;
            self.rides.insert(ride_id, &ride);

            Ok(())
        }

        /// Release payment to driver and refund excess to customer
        #[ink(message)]
        pub fn release_payment(
            &mut self,
            ride_id: String,
            actual_fare: Balance,
        ) -> Result<(), String> {
            let mut ride = self.rides.get(&ride_id).ok_or("Ride not found")?;

            if ride.status != RideStatus::InProgress {
                return Err("Ride not in progress".to_string());
            }

            let driver = ride.driver.ok_or("No driver assigned")?;

            // Ensure actual fare doesn't exceed staked amount
            let fare = if actual_fare > ride.staked_amount {
                ride.staked_amount
            } else {
                actual_fare
            };

            // Calculate refund
            let refund = ride.staked_amount.saturating_sub(fare);

            // Transfer fare to driver
            if self.env().transfer(driver, fare).is_err() {
                return Err("Failed to transfer to driver".to_string());
            }

            // Refund excess to customer
            if refund > 0 {
                if self.env().transfer(ride.customer, refund).is_err() {
                    return Err("Failed to refund customer".to_string());
                }

                self.env().emit_event(PaymentRefunded {
                    ride_id: ride_id.clone(),
                    customer: ride.customer,
                    refund_amount: refund,
                });
            }

            ride.status = RideStatus::Completed;
            ride.actual_fare = fare;
            ride.completed_at = Some(self.env().block_timestamp());
            self.rides.insert(ride_id.clone(), &ride);

            self.env().emit_event(PaymentReleased {
                ride_id,
                driver,
                amount_paid: fare,
            });

            Ok(())
        }

        /// Cancel a ride and refund all tokens
        #[ink(message)]
        pub fn cancel_ride(&mut self, ride_id: String) -> Result<(), String> {
            let mut ride = self.rides.get(&ride_id).ok_or("Ride not found")?;

            let caller = self.env().caller();

            // Only customer or contract owner can cancel
            if caller != ride.customer && caller != self.owner {
                return Err("Unauthorized".to_string());
            }

            if ride.status == RideStatus::Completed || ride.status == RideStatus::Cancelled {
                return Err("Cannot cancel completed or already cancelled ride".to_string());
            }

            // Refund staked amount to customer
            if self
                .env()
                .transfer(ride.customer, ride.staked_amount)
                .is_err()
            {
                return Err("Failed to refund".to_string());
            }

            ride.status = RideStatus::Cancelled;
            self.rides.insert(ride_id, &ride);

            Ok(())
        }

        /// Get ride details
        #[ink(message)]
        pub fn get_ride(&self, ride_id: String) -> Option<Ride> {
            self.rides.get(&ride_id)
        }

        /// Get all active rides
        #[ink(message)]
        pub fn get_active_rides(&self) -> Vec<String> {
            self.active_rides.clone()
        }

        /// Get contract balance (total escrow held)
        #[ink(message)]
        pub fn get_balance(&self) -> Balance {
            self.env().balance()
        }

        /// Get total rides created
        #[ink(message)]
        pub fn get_ride_count(&self) -> u32 {
            self.ride_count
        }

        /// Withdraw funds (only owner)
        #[ink(message)]
        pub fn withdraw(&mut self, amount: Balance) -> Result<(), String> {
            if self.env().caller() != self.owner {
                return Err("Only owner can withdraw".to_string());
            }

            if self.env().transfer(self.owner, amount).is_err() {
                return Err("Withdrawal failed".to_string());
            }

            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_stake_for_ride() {
            let mut contract = DropmateEscrow::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_transferred_value::<ink::env::DefaultEnvironment>(100);

            let result = contract.stake_for_ride(
                "ride_001".to_string(),
                50,
                37774900,
                -122419400,
                37338200,
                -121886300,
            );

            assert!(result.is_ok());
            assert_eq!(contract.get_ride_count(), 1);
        }

        #[ink::test]
        fn test_accept_ride() {
            let mut contract = DropmateEscrow::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_transferred_value::<ink::env::DefaultEnvironment>(100);

            contract
                .stake_for_ride(
                    "ride_001".to_string(),
                    50,
                    37774900,
                    -122419400,
                    37338200,
                    -121886300,
                )
                .unwrap();

            let result = contract.accept_ride("ride_001".to_string(), accounts.bob);
            assert!(result.is_ok());
        }
    }
}
