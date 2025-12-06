#![cfg_attr(not(feature = "std"), no_std, no_main)]

/// # FreelanceEscrowMetadata Contract
/// 
/// This contract stores project metadata, deliverables, and milestone tracking
/// for the PolkStellar dual-chain freelance platform.
/// 
/// Financial escrow is handled on Stellar (Soroban).
/// This contract focuses on project data and workflow management.

#[ink::contract]
mod freelance_escrow_metadata {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Project status enum
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum ProjectStatus {
        Active,
        InProgress,
        Completed,
        Disputed,
        Cancelled,
    }

    /// Milestone status enum
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum MilestoneStatus {
        Pending,
        InReview,
        Approved,
        Rejected,
    }

    /// Project metadata structure
    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct ProjectMetadata {
        pub project_id: u64,
        pub title: String,
        pub description: String,
        pub client: AccountId,
        pub freelancer: AccountId,
        pub budget: u128,
        pub deadline: u64,
        pub milestone_count: u8,
        pub status: ProjectStatus,
        pub created_at: u64,
    }

    /// Deliverable submission structure
    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Deliverable {
        pub project_id: u64,
        pub milestone_id: u8,
        pub description: String,
        pub proof_url: String,
        pub submitted_at: u64,
        pub status: MilestoneStatus,
        pub reviewer_notes: Option<String>,
    }

    /// Main contract storage
    #[ink(storage)]
    pub struct FreelanceEscrowMetadata {
        /// Auto-incrementing project counter
        project_count: u64,
        /// Maps project_id -> ProjectMetadata
        projects: Mapping<u64, ProjectMetadata>,
        /// Maps user address -> Vec<project_ids> (their projects as client)
        client_projects: Mapping<AccountId, Vec<u64>>,
        /// Maps user address -> Vec<project_ids> (their projects as freelancer)
        freelancer_projects: Mapping<AccountId, Vec<u64>>,
        /// Maps (project_id, milestone_id) -> Deliverable
        deliverables: Mapping<(u64, u8), Deliverable>,
        /// Maps project_id -> Vec<milestone_ids> that have been submitted
        submitted_milestones: Mapping<u64, Vec<u8>>,
    }

    /// Events
    #[ink(event)]
    pub struct ProjectRegistered {
        #[ink(topic)]
        project_id: u64,
        #[ink(topic)]
        client: AccountId,
        #[ink(topic)]
        freelancer: AccountId,
    }

    #[ink(event)]
    pub struct DeliverableSubmitted {
        #[ink(topic)]
        project_id: u64,
        milestone_id: u8,
        #[ink(topic)]
        freelancer: AccountId,
    }

    #[ink(event)]
    pub struct DeliverableReviewed {
        #[ink(topic)]
        project_id: u64,
        milestone_id: u8,
        status: MilestoneStatus,
        #[ink(topic)]
        reviewer: AccountId,
    }

    /// Errors
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Caller is not authorized
        Unauthorized,
        /// Project not found
        ProjectNotFound,
        /// Deliverable not found
        DeliverableNotFound,
        /// Invalid milestone ID
        InvalidMilestone,
        /// Milestone already submitted
        MilestoneAlreadySubmitted,
        /// Invalid project status
        InvalidStatus,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl FreelanceEscrowMetadata {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                project_count: 0,
                projects: Mapping::default(),
                client_projects: Mapping::default(),
                freelancer_projects: Mapping::default(),
                deliverables: Mapping::default(),
                submitted_milestones: Mapping::default(),
            }
        }

        /// Register a new project
        /// 
        /// # Arguments
        /// * `title` - Project title
        /// * `description` - Project description
        /// * `freelancer` - Freelancer address
        /// * `budget` - Total budget in smallest unit
        /// * `deadline` - Unix timestamp deadline
        /// * `milestone_count` - Number of milestones
        #[ink(message)]
        pub fn register_project(
            &mut self,
            title: String,
            description: String,
            freelancer: AccountId,
            budget: u128,
            deadline: u64,
            milestone_count: u8,
        ) -> Result<u64> {
            let caller = self.env().caller();
            self.project_count += 1;
            let project_id = self.project_count;

            let project = ProjectMetadata {
                project_id,
                title,
                description,
                client: caller,
                freelancer,
                budget,
                deadline,
                milestone_count,
                status: ProjectStatus::Active,
                created_at: self.env().block_timestamp(),
            };

            // Store project
            self.projects.insert(project_id, &project);

            // Add to client's projects
            let mut client_list = self.client_projects.get(caller).unwrap_or_default();
            client_list.push(project_id);
            self.client_projects.insert(caller, &client_list);

            // Add to freelancer's projects
            let mut freelancer_list = self.freelancer_projects.get(freelancer).unwrap_or_default();
            freelancer_list.push(project_id);
            self.freelancer_projects.insert(freelancer, &freelancer_list);

            // Emit event
            self.env().emit_event(ProjectRegistered {
                project_id,
                client: caller,
                freelancer,
            });

            Ok(project_id)
        }

        /// Submit a deliverable for a milestone
        /// 
        /// # Arguments
        /// * `project_id` - Project ID
        /// * `milestone_id` - Milestone number (1-indexed)
        /// * `description` - Deliverable description
        /// * `proof_url` - URL to deliverable proof (IPFS, GitHub, etc.)
        #[ink(message)]
        pub fn submit_deliverable(
            &mut self,
            project_id: u64,
            milestone_id: u8,
            description: String,
            proof_url: String,
        ) -> Result<()> {
            let caller = self.env().caller();
            let project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            // Only freelancer can submit
            if caller != project.freelancer {
                return Err(Error::Unauthorized);
            }

            // Validate milestone ID
            if milestone_id == 0 || milestone_id > project.milestone_count {
                return Err(Error::InvalidMilestone);
            }

            // Check if already submitted
            let submitted = self.submitted_milestones.get(project_id).unwrap_or_default();
            if submitted.contains(&milestone_id) {
                return Err(Error::MilestoneAlreadySubmitted);
            }

            let deliverable = Deliverable {
                project_id,
                milestone_id,
                description,
                proof_url,
                submitted_at: self.env().block_timestamp(),
                status: MilestoneStatus::InReview,
                reviewer_notes: None,
            };

            // Store deliverable
            self.deliverables.insert((project_id, milestone_id), &deliverable);

            // Mark milestone as submitted
            let mut submitted_list = submitted;
            submitted_list.push(milestone_id);
            self.submitted_milestones.insert(project_id, &submitted_list);

            // Emit event
            self.env().emit_event(DeliverableSubmitted {
                project_id,
                milestone_id,
                freelancer: caller,
            });

            Ok(())
        }

        /// Review and approve/reject a deliverable
        /// 
        /// # Arguments
        /// * `project_id` - Project ID
        /// * `milestone_id` - Milestone number
        /// * `approved` - True to approve, false to reject
        /// * `notes` - Optional reviewer notes
        #[ink(message)]
        pub fn review_deliverable(
            &mut self,
            project_id: u64,
            milestone_id: u8,
            approved: bool,
            notes: Option<String>,
        ) -> Result<()> {
            let caller = self.env().caller();
            let project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            // Only client can review
            if caller != project.client {
                return Err(Error::Unauthorized);
            }

            let mut deliverable = self
                .deliverables
                .get((project_id, milestone_id))
                .ok_or(Error::DeliverableNotFound)?;

            // Update status
            deliverable.status = if approved {
                MilestoneStatus::Approved
            } else {
                MilestoneStatus::Rejected
            };
            deliverable.reviewer_notes = notes;

            // Store updated deliverable
            self.deliverables.insert((project_id, milestone_id), &deliverable);

            // Emit event
            self.env().emit_event(DeliverableReviewed {
                project_id,
                milestone_id,
                status: deliverable.status,
                reviewer: caller,
            });

            Ok(())
        }

        /// Update project status
        #[ink(message)]
        pub fn update_project_status(
            &mut self,
            project_id: u64,
            status: ProjectStatus,
        ) -> Result<()> {
            let caller = self.env().caller();
            let mut project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            // Only client can update status
            if caller != project.client {
                return Err(Error::Unauthorized);
            }

            project.status = status;
            self.projects.insert(project_id, &project);

            Ok(())
        }

        // =======================================================================
        // READ FUNCTIONS
        // =======================================================================

        /// Get project by ID
        #[ink(message)]
        pub fn get_project(&self, project_id: u64) -> Option<ProjectMetadata> {
            self.projects.get(project_id)
        }

        /// Get deliverable
        #[ink(message)]
        pub fn get_deliverable(&self, project_id: u64, milestone_id: u8) -> Option<Deliverable> {
            self.deliverables.get((project_id, milestone_id))
        }

        /// Get all submitted milestones for a project
        #[ink(message)]
        pub fn get_submitted_milestones(&self, project_id: u64) -> Vec<u8> {
            self.submitted_milestones.get(project_id).unwrap_or_default()
        }

        /// Get projects where caller is client
        #[ink(message)]
        pub fn get_my_client_projects(&self) -> Vec<u64> {
            let caller = self.env().caller();
            self.client_projects.get(caller).unwrap_or_default()
        }

        /// Get projects where caller is freelancer
        #[ink(message)]
        pub fn get_my_freelancer_projects(&self) -> Vec<u64> {
            let caller = self.env().caller();
            self.freelancer_projects.get(caller).unwrap_or_default()
        }

        /// Get total project count
        #[ink(message)]
        pub fn get_project_count(&self) -> u64 {
            self.project_count
        }

        /// Get milestone status
        #[ink(message)]
        pub fn get_milestone_status(&self, project_id: u64, milestone_id: u8) -> MilestoneStatus {
            self.deliverables
                .get((project_id, milestone_id))
                .map(|d| d.status)
                .unwrap_or(MilestoneStatus::Pending)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn register_project_works() {
            let mut contract = FreelanceEscrowMetadata::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            let project_id = contract
                .register_project(
                    String::from("Test Project"),
                    String::from("Description"),
                    accounts.bob,
                    1000,
                    1000000,
                    3,
                )
                .unwrap();

            assert_eq!(project_id, 1);
            assert_eq!(contract.get_project_count(), 1);
            
            let project = contract.get_project(project_id).unwrap();
            assert_eq!(project.title, "Test Project");
            assert_eq!(project.freelancer, accounts.bob);
        }

        #[ink::test]
        fn submit_deliverable_works() {
            let mut contract = FreelanceEscrowMetadata::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Register project
            let project_id = contract
                .register_project(
                    String::from("Test"),
                    String::from("Desc"),
                    accounts.bob,
                    1000,
                    1000000,
                    3,
                )
                .unwrap();

            // Switch to freelancer account
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);

            // Submit deliverable
            contract
                .submit_deliverable(
                    project_id,
                    1,
                    String::from("Milestone 1 complete"),
                    String::from("ipfs://hash"),
                )
                .unwrap();

            let deliverable = contract.get_deliverable(project_id, 1).unwrap();
            assert_eq!(deliverable.milestone_id, 1);
            assert_eq!(deliverable.status, MilestoneStatus::InReview);
        }
    }
}
