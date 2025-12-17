# Emergency Fund Release DAO - Mock Data Output

This document provides a comprehensive example of the DAO workflow with mock data.

## 📊 Test Scenario: Emergency Heart Surgery Funding

### Initial Setup

#### DAO Configuration
```json
{
  "voting_threshold": 66,
  "initial_treasury": 0,
  "total_members": 3
}
```

#### Participants
```json
{
  "admin": "CAAAAAAAAAAAAAAAAAAAAAAA...",
  "hospital": "GBXXXXXXXXXXXXXXXXXXX...",
  "members": [
    {
      "id": "member_1",
      "address": "GAXXXXXXXXXXXXXXXXXXX...",
      "voting_power": 1
    },
    {
      "id": "member_2", 
      "address": "GAYXXXXXXXXXXXXXXXXXX...",
      "voting_power": 1
    },
    {
      "id": "member_3",
      "address": "GAZXXXXXXXXXXXXXXXXXX...",
      "voting_power": 1
    }
  ]
}
```

## Step-by-Step Workflow

### Step 1: DAO Initialization

**Action:** Initialize DAO with admin and voting threshold

**Input:**
```rust
client.initialize(&admin, &66);
```

**Output:**
```json
{
  "status": "success",
  "dao_state": {
    "admin": "CAAAAAAAAAAAAAAAAAAAAAAA...",
    "voting_threshold": 66,
    "treasury_balance": 0,
    "proposal_count": 0
  }
}
```

---

### Step 2: Fund the Treasury

**Action:** Add funds to DAO treasury

**Input:**
```rust
client.add_funds(&100000);
```

**Output:**
```json
{
  "status": "success",
  "treasury": {
    "previous_balance": 0,
    "amount_added": 100000,
    "new_balance": 100000,
    "unit": "stroops"
  }
}
```

---

### Step 3: Add DAO Members

**Action:** Admin adds voting members

**Input:**
```rust
client.add_member(&admin, &member1);
client.add_member(&admin, &member2);
client.add_member(&admin, &member3);
```

**Output:**
```json
{
  "status": "success",
  "members": [
    {
      "address": "GAXXXXXXXXXXXXXXXXXXX...",
      "is_active": true,
      "can_vote": true
    },
    {
      "address": "GAYXXXXXXXXXXXXXXXXXX...",
      "is_active": true,
      "can_vote": true
    },
    {
      "address": "GAZXXXXXXXXXXXXXXXXXX...",
      "is_active": true,
      "can_vote": true
    }
  ],
  "total_members": 3
}
```

---

### Step 4: Hospital Submits Proposal

**Action:** Hospital submits emergency funding request

**Input:**
```rust
client.submit_proposal(
    &hospital,
    &String::from_str(&env, "Sarah Martinez"),
    &String::from_str(&env, "Emergency: Acute heart failure requiring immediate bypass surgery. Patient is 45-year-old with no insurance."),
    &25000
);
```

**Output:**
```json
{
  "status": "success",
  "proposal": {
    "id": 1,
    "hospital_address": "GBXXXXXXXXXXXXXXXXXXX...",
    "patient": {
      "name": "Sarah Martinez",
      "age": 45,
      "medical_details": "Emergency: Acute heart failure requiring immediate bypass surgery. Patient is 45-year-old with no insurance.",
      "urgency_level": "critical"
    },
    "funding": {
      "amount_requested": 25000,
      "currency": "stroops",
      "usd_equivalent": "$2,500"
    },
    "voting": {
      "status": "Active",
      "votes_for": 0,
      "votes_against": 0,
      "total_votes": 0,
      "approval_rate": "0%"
    },
    "created_at": 1701792000,
    "proposal_count": 1
  }
}
```

---

### Step 5: Voting Phase

#### Vote 1 - Member 1 Approves

**Input:**
```rust
client.vote(&member1, &1, &true);
```

**Output:**
```json
{
  "status": "success",
  "vote": {
    "proposal_id": 1,
    "voter": "GAXXXXXXXXXXXXXXXXXXX...",
    "decision": "APPROVE",
    "timestamp": 1701792060
  },
  "proposal_state": {
    "votes_for": 1,
    "votes_against": 0,
    "total_votes": 1,
    "approval_rate": "100%",
    "status": "Active"
  }
}
```

#### Vote 2 - Member 2 Approves

**Input:**
```rust
client.vote(&member2, &1, &true);
```

**Output:**
```json
{
  "status": "success",
  "vote": {
    "proposal_id": 1,
    "voter": "GAYXXXXXXXXXXXXXXXXXX...",
    "decision": "APPROVE",
    "timestamp": 1701792120
  },
  "proposal_state": {
    "votes_for": 2,
    "votes_against": 0,
    "total_votes": 2,
    "approval_rate": "100%",
    "status": "Active"
  }
}
```

#### Vote 3 - Member 3 Rejects

**Input:**
```rust
client.vote(&member3, &1, &false);
```

**Output:**
```json
{
  "status": "success",
  "vote": {
    "proposal_id": 1,
    "voter": "GAZXXXXXXXXXXXXXXXXXX...",
    "decision": "REJECT",
    "timestamp": 1701792180
  },
  "proposal_state": {
    "votes_for": 2,
    "votes_against": 1,
    "total_votes": 3,
    "approval_rate": "66%",
    "status": "Active",
    "note": "Minimum votes reached (3)"
  }
}
```

---

### Step 6: Finalize Voting

**Action:** Finalize proposal after sufficient votes

**Input:**
```rust
client.finalize_proposal(&1);
```

**Output:**
```json
{
  "status": "success",
  "finalization": {
    "proposal_id": 1,
    "votes_summary": {
      "votes_for": 2,
      "votes_against": 1,
      "total_votes": 3,
      "approval_rate": 66,
      "required_threshold": 66
    },
    "decision": "APPROVED",
    "reason": "Approval rate (66%) meets or exceeds threshold (66%)",
    "new_status": "Approved"
  }
}
```

---

### Step 7: Execute Proposal

**Action:** Release funds to hospital

**Input:**
```rust
client.execute_proposal(&1);
```

**Output:**
```json
{
  "status": "success",
  "execution": {
    "proposal_id": 1,
    "patient_name": "Sarah Martinez",
    "hospital": "GBXXXXXXXXXXXXXXXXXXX...",
    "funding": {
      "amount_disbursed": 25000,
      "unit": "stroops",
      "usd_equivalent": "$2,500"
    },
    "treasury": {
      "balance_before": 100000,
      "amount_disbursed": 25000,
      "balance_after": 75000,
      "remaining_funds": "75000 stroops ($7,500)"
    },
    "new_status": "Executed",
    "executed_at": 1701792240
  }
}
```

---

## Final DAO State

```json
{
  "dao_summary": {
    "voting_threshold": 66,
    "total_proposals": 1,
    "treasury_balance": 75000,
    "total_members": 3,
    "proposals": {
      "active": 0,
      "approved": 0,
      "rejected": 0,
      "executed": 1
    }
  },
  "proposal_1": {
    "id": 1,
    "status": "Executed",
    "patient": "Sarah Martinez",
    "amount_disbursed": 25000,
    "votes": {
      "for": 2,
      "against": 1,
      "approval_rate": "66%"
    }
  },
  "treasury": {
    "initial_balance": 100000,
    "total_disbursed": 25000,
    "remaining_balance": 75000,
    "available_for_future_proposals": 75000
  }
}
```

---

## Alternative Scenarios

### Scenario A: Rejected Proposal

**Configuration:**
- Voting threshold: 66%
- Votes: 1 approve, 2 reject
- Approval rate: 33%

**Result:**
```json
{
  "status": "Rejected",
  "reason": "Approval rate (33%) below threshold (66%)",
  "treasury_impact": "No funds disbursed"
}
```

### Scenario B: Insufficient Funds

**Configuration:**
- Treasury balance: 1000 stroops
- Amount requested: 5000 stroops
- Proposal status: Approved

**Result:**
```json
{
  "error": "Insufficient funds in treasury",
  "treasury_balance": 1000,
  "amount_needed": 5000,
  "shortfall": 4000
}
```

### Scenario C: Multiple Proposals

**Configuration:**
- Proposal 1: 15000 stroops (Approved & Executed)
- Proposal 2: 12000 stroops (Rejected)
- Proposal 3: 8000 stroops (Active)

**Result:**
```json
{
  "treasury": {
    "initial": 50000,
    "disbursed": 15000,
    "remaining": 35000
  },
  "proposals": [
    {"id": 1, "status": "Executed", "amount": 15000},
    {"id": 2, "status": "Rejected", "amount": 12000},
    {"id": 3, "status": "Active", "amount": 8000}
  ]
}
```

---

## Test Verification Points

All test assertions passed:
- ✅ DAO initialization successful
- ✅ Voting threshold set correctly (66%)
- ✅ Treasury funded successfully (100,000 stroops)
- ✅ 3 members added and verified
- ✅ Proposal created with ID = 1
- ✅ Patient name stored correctly
- ✅ Amount requested = 25,000 stroops
- ✅ All 3 members voted successfully
- ✅ Vote tallies accurate (2 for, 1 against)
- ✅ Approval rate calculated correctly (66%)
- ✅ Proposal approved (66% ≥ 66% threshold)
- ✅ Proposal executed successfully
- ✅ Treasury deducted correctly (75,000 remaining)
- ✅ Proposal status updated to "Executed"

---

## Performance Metrics

```json
{
  "test_execution": {
    "total_tests": 12,
    "passed": 12,
    "failed": 0,
    "execution_time": "0.12 seconds",
    "gas_efficiency": "optimal"
  },
  "contract_operations": {
    "initialize": "1 call",
    "add_funds": "1 call",
    "add_member": "3 calls",
    "submit_proposal": "1 call",
    "vote": "3 calls",
    "finalize_proposal": "1 call",
    "execute_proposal": "1 call",
    "total_operations": 11
  }
}
```

---

## Summary

This mock data demonstrates a complete emergency funding workflow:

1. **DAO Setup**: Admin initializes with 66% voting threshold
2. **Treasury Funding**: 100,000 stroops added
3. **Member Onboarding**: 3 voting members added
4. **Emergency Request**: Hospital submits proposal for heart surgery patient
5. **Democratic Voting**: Members vote (2 approve, 1 reject)
6. **Threshold Met**: 66% approval meets 66% threshold
7. **Funds Released**: 25,000 stroops disbursed to hospital
8. **Final State**: 75,000 stroops remain for future emergencies

The system ensures transparent, democratic, and efficient emergency fund distribution! 🏥💰✅
