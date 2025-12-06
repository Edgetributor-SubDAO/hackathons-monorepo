#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short,
    Address, Env, Map, Symbol, Vec, log,
}; //using all these packages from soroban_sdk

// =============================================================================
// DATA STRUCTURES
// =============================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus { //milestone can ve any of these at given point in time
    Pending,
    Funded,
    Submitted,
    Approved,
    Released,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Milestone {
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Project {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub milestones: Vec<Milestone>,
    pub total_funded: i128,
    pub total_released: i128,
}

// Storage keys
const PROJECTS: Symbol = symbol_short!("PROJECTS");
const PROJECT_COUNT: Symbol = symbol_short!("PRJ_CNT");

// =============================================================================
// CONTRACT
// =============================================================================

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    // -------------------------------------------------------------------------
    // CREATE PROJECT
    // -------------------------------------------------------------------------
    /// Creates a new escrow project with milestones
    /// Returns the project ID
    pub fn create_project(
        env: Env,
        client: Address,
        freelancer: Address,
        milestone_amounts: Vec<i128>,
    ) -> u64 {
        // Client must authorize this transaction
        client.require_auth();

        // Get next project ID
        let project_id: u64 = env
            .storage()
            .instance()
            .get(&PROJECT_COUNT)
            .unwrap_or(0) + 1;

        // Create milestones from amounts
        let mut milestones: Vec<Milestone> = Vec::new(&env);
        for amount in milestone_amounts.iter() {
            milestones.push_back(Milestone {
                amount,
                status: MilestoneStatus::Pending,
            });
        }

        // Create project
        let project = Project {
            id: project_id,
            client: client.clone(),
            freelancer: freelancer.clone(),
            milestones,
            total_funded: 0,
            total_released: 0,
        };

        // Store project
        let mut projects: Map<u64, Project> = env
            .storage()
            .instance()
            .get(&PROJECTS)
            .unwrap_or(Map::new(&env));
        
        projects.set(project_id, project);
        env.storage().instance().set(&PROJECTS, &projects);
        env.storage().instance().set(&PROJECT_COUNT, &project_id);

        log!(&env, "Project created: {}", project_id);

        project_id
    }

    // -------------------------------------------------------------------------
    // FUND PROJECT
    // -------------------------------------------------------------------------
    /// Client funds a specific milestone
    /// In production, this would transfer tokens to the contract
    pub fn fund_milestone(
        env: Env,
        project_id: u64,
        milestone_index: u32,
    ) -> Result<i128, Error> {
        let mut projects: Map<u64, Project> = env
            .storage()
            .instance()
            .get(&PROJECTS)
            .ok_or(Error::ProjectNotFound)?;

        let mut project = projects.get(project_id).ok_or(Error::ProjectNotFound)?;
        
        // Only client can fund
        project.client.require_auth();

        // Get milestone
        let idx = milestone_index as u32;
        if idx >= project.milestones.len() {
            return Err(Error::InvalidMilestone);
        }

        let mut milestone = project.milestones.get(idx).unwrap();
        
        if milestone.status != MilestoneStatus::Pending {
            return Err(Error::AlreadyFunded);
        }

        // Update milestone status
        milestone.status = MilestoneStatus::Funded;
        project.milestones.set(idx, milestone.clone());
        project.total_funded += milestone.amount;

        // Save
        projects.set(project_id, project);
        env.storage().instance().set(&PROJECTS, &projects);

        log!(&env, "Milestone {} funded: {}", milestone_index, milestone.amount);

        Ok(milestone.amount)
    }

    // -------------------------------------------------------------------------
    // APPROVE AND RELEASE
    // -------------------------------------------------------------------------
    /// Client approves milestone and releases funds to freelancer
    pub fn release_milestone(
        env: Env,
        project_id: u64,
        milestone_index: u32,
    ) -> Result<i128, Error> {
        let mut projects: Map<u64, Project> = env
            .storage()
            .instance()
            .get(&PROJECTS)
            .ok_or(Error::ProjectNotFound)?;

        let mut project = projects.get(project_id).ok_or(Error::ProjectNotFound)?;
        
        // Only client can release
        project.client.require_auth();

        // Get milestone
        let idx = milestone_index as u32;
        if idx >= project.milestones.len() {
            return Err(Error::InvalidMilestone);
        }

        let mut milestone = project.milestones.get(idx).unwrap();
        
        // Must be funded (or submitted) to release
        if milestone.status != MilestoneStatus::Funded && 
           milestone.status != MilestoneStatus::Submitted {
            return Err(Error::NotReleasable);
        }

        let amount = milestone.amount;

        // Update status
        milestone.status = MilestoneStatus::Released;
        project.milestones.set(idx, milestone);
        project.total_released += amount;

        // Save
        projects.set(project_id, project.clone());
        env.storage().instance().set(&PROJECTS, &projects);

        // In production: Transfer tokens to freelancer
        // token::Client::new(&env, &token_address).transfer(
        //     &env.current_contract_address(),
        //     &project.freelancer,
        //     &amount
        // );

        log!(&env, "Released {} to freelancer", amount);

        Ok(amount)
    }

    // -------------------------------------------------------------------------
    // MARK SUBMITTED (Freelancer action)
    // -------------------------------------------------------------------------
    /// Freelancer marks milestone as submitted (work done)
    pub fn submit_milestone(
        env: Env,
        project_id: u64,
        milestone_index: u32,
    ) -> Result<(), Error> {
        let mut projects: Map<u64, Project> = env
            .storage()
            .instance()
            .get(&PROJECTS)
            .ok_or(Error::ProjectNotFound)?;

        let mut project = projects.get(project_id).ok_or(Error::ProjectNotFound)?;
        
        // Only freelancer can submit
        project.freelancer.require_auth();

        // Get milestone
        let idx = milestone_index as u32;
        if idx >= project.milestones.len() {
            return Err(Error::InvalidMilestone);
        }

        let mut milestone = project.milestones.get(idx).unwrap();
        
        if milestone.status != MilestoneStatus::Funded {
            return Err(Error::NotFunded);
        }

        // Update status
        milestone.status = MilestoneStatus::Submitted;
        project.milestones.set(idx, milestone);

        // Save
        projects.set(project_id, project);
        env.storage().instance().set(&PROJECTS, &projects);

        log!(&env, "Milestone {} submitted", milestone_index);

        Ok(())
    }

    // -------------------------------------------------------------------------
    // READ FUNCTIONS
    // -------------------------------------------------------------------------

    /// Get project details
    pub fn get_project(env: Env, project_id: u64) -> Result<Project, Error> {
        let projects: Map<u64, Project> = env
            .storage()
            .instance()
            .get(&PROJECTS)
            .ok_or(Error::ProjectNotFound)?;

        projects.get(project_id).ok_or(Error::ProjectNotFound)
    }

    /// Get project count
    pub fn get_project_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&PROJECT_COUNT)
            .unwrap_or(0)
    }

    /// Get escrow balance (funded - released)
    pub fn get_balance(env: Env, project_id: u64) -> Result<i128, Error> {
        let project = Self::get_project(env, project_id)?;
        Ok(project.total_funded - project.total_released)
    }
}

// =============================================================================
// ERRORS
// =============================================================================

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    ProjectNotFound = 1,
    InvalidMilestone = 2,
    AlreadyFunded = 3,
    NotFunded = 4,
    NotReleasable = 5,
    Unauthorized = 6,
}

// =============================================================================
// TESTS
// =============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_create_project() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);

        let client_addr = Address::generate(&env);
        let freelancer_addr = Address::generate(&env);
        
        let milestones = Vec::from_array(&env, [1000_i128, 2000_i128, 1500_i128]);

        let project_id = client.create_project(&client_addr, &freelancer_addr, &milestones);
        
        assert_eq!(project_id, 1);
        assert_eq!(client.get_project_count(), 1);

        let project = client.get_project(&project_id);
        assert_eq!(project.milestones.len(), 3);
        assert_eq!(project.total_funded, 0);
    }

    #[test]
    fn test_fund_and_release() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);

        let client_addr = Address::generate(&env);
        let freelancer_addr = Address::generate(&env);
        
        let milestones = Vec::from_array(&env, [1000_i128, 2000_i128]);

        let project_id = client.create_project(&client_addr, &freelancer_addr, &milestones);
        
        // Fund first milestone
        let funded = client.fund_milestone(&project_id, &0);
        assert_eq!(funded, 1000);

        // Check balance
        let balance = client.get_balance(&project_id);
        assert_eq!(balance, 1000);

        // Freelancer submits
        client.submit_milestone(&project_id, &0);

        // Client releases
        let released = client.release_milestone(&project_id, &0);
        assert_eq!(released, 1000);

        // Balance should be 0
        let balance = client.get_balance(&project_id);
        assert_eq!(balance, 0);
    }
}
