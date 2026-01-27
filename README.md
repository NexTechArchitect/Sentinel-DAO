
# 🛡️ Sentinel DAO Protocol

[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFdb1C.svg)](https://getfoundry.sh/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-363636.svg)](https://docs.soliditylang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Network](https://img.shields.io/badge/Network-Sepolia-grey)](https://sepolia.etherscan.io/)
[![Status](https://img.shields.io/badge/Deployment-Verified-brightgreen)]()

> **A production-grade, modular governance framework engineered for security, scalability, and DeFi integration.**

**Sentinel DAO** represents a paradigm shift in on-chain organization management. Moving beyond simple voting, it implements a **Hybrid Governance Model** (Token + Time-Weighted + Quadratic) backed by an **Optimistic Security Layer** (Veto Councils, RageQuit). The protocol features a DeFi-native Treasury that autonomously generates yield via **Aave V3**, turning idle assets into productive capital.

---

## 📑 Table of Contents

- [🏛️ System Architecture](#️-system-architecture)
- [📂 Detailed Code Structure](#-detailed-code-structure)
- [🧠 Advanced Module Internals](#-advanced-module-internals)
- [✅ Deployed Contracts (Verified)](#-deployed-contracts-verified)
- [🛠️ Installation & Setup](#️-installation--setup)
- [🧪 Testing & QA](#-testing--qa)
- [⚠️ Disclaimer](#️-disclaimer)

---

## 🏛️ System Architecture

The protocol utilizes a **Hub-and-Spoke** architecture centered around the `DAOCore` registry. This ensures modularity, allowing individual components (like voting strategies or security modules) to be upgraded without migrating the entire DAO.

```mermaid
graph TD
    subgraph Core
    Governor[Hybrid Governor] <--> Core[DAO Core Registry]
    Core <--> Timelock[Timelock Controller]
    Core <--> Treasury[DAO Treasury]
    end

    subgraph Governance
    Token[Gov Token] --> Governor
    QF[Quadratic Funding] -.-> Governor
    Conviction[Conviction Voting] -.-> Governor
    end

    subgraph Security
    Veto[Veto Council] -- Cancels --> Governor
    Guard[Proposal Guard] -- Validates --> Governor
    Pause[Emergency Pause] -- Freezes --> Core
    end

    subgraph DeFi
    Treasury -- Yield Strategy --> AaveV3[Aave Pool]
    end

```

---

## 📂 Detailed Code Structure

A comprehensive breakdown of the smart contract architecture designed for modularity and separation of concerns.

```text
src
└── contracts
    ├── config
    │   └── DAOConfig.sol            # Dynamic parameter management (Quorum, Thresholds)
    ├── core                         # THE KERNEL
    │   ├── DAOCore.sol              # Central Registry & Access Hub
    │   ├── DAOTimelock.sol          # Time-delayed execution controller (OpenZeppelin ext)
    │   ├── DAOTreasury.sol          # Multi-asset Vault (ETH/ERC20/721/1155)
    │   ├── HybridGovernorDynamic.sol# Main Decision Engine (Supports multiple vote types)
    │   └── TreasuryYieldStrategy.sol# Aave V3 Integration Logic
    ├── delegation
    │   └── DelegationRegistry.sol   # Advanced delegation logic with EIP-712 Sig support
    ├── governance                   # VOTING ENGINES
    │   ├── ConvictionStaking.sol    # Locking mechanism for Conviction Voting
    │   ├── ConvictionVoting.sol     # Time-weighted staking logic
    │   ├── GovernanceToken.sol      # ERC20Votes with Delegation & Snapshots
    │   ├── ProposalGuard.sol        # Anti-spam & Sanitation checks
    │   ├── QuadraticFunding.sol     # Sqrt-based voting for public goods allocation
    │   ├── RageQuit.sol             # Minority protection exit mechanism
    │   ├── VetoCouncil.sol          # Optimistic Security (Guardian Multisig)
    │   └── VotingStrategies.sol     # Mathematical libraries for power calculation
    ├── offchain                     # REAL WORLD BRIDGE
    │   ├── OffchainResultExecutor.sol # Execution bridge for Snapshot.org
    │   └── VotingPowerSnapshot.sol    # Historical power tracking
    ├── security                     # SENTINEL LAYER
    │   ├── EmergencyPause.sol       # Circuit breaker for critical bugs
    │   ├── GovernanceAnalytics.sol  # On-chain data tracking & metrics
    │   └── RoleManager.sol          # RBAC (Admin, Guardian, Proposer roles)
    ├── upgrades                     # UPGRADEABILITY
    │   ├── GovernanceUUPS.sol       # UUPS Proxy standard implementation
    │   └── UpgradeExecutor.sol      # Secure upgrade path logic
    └── utils                        # HELPERS
        └── SignatureVerifier.sol    # EIP-712 Signature validation

```

---

## 🧠 Advanced Module Internals

Here is how the most critical and complex components of the system function:

### 1. Quadratic Funding (QF)

* **Problem:** Standard 1-token-1-vote systems are dominated by whales.
* **Solution:** We use the Square Root formula to calculate matching funds.
* **Logic:** The cost to buy `n` votes is `n^2`. This means 100 people donating 1 DAI has significantly more impact than 1 person donating 100 DAI.
* **Implementation:** `QuadraticFunding.sol` tracks unique contributor addresses per project to calculate the subsidy match from the Treasury.

### 2. Autonomous Treasury (Yield Strategy)

* **Problem:** DAO Treasuries often sit idle, losing value to inflation.
* **Solution:** Integration with **Aave V3**.
* **Logic:** The `TreasuryYieldStrategy.sol` contract serves as a bridge.
1. `depositToAave(token, amount)`: Approves and supplies assets to the Aave Lending Pool.
2. `withdrawFromAave(token, amount)`: Redeems aTokens back for underlying assets when needed for proposal execution.


* **Safety:** Only the Timelock execution can trigger withdrawals, preventing unauthorized drains.

### 3. Conviction Voting

* **Problem:** Flash-loan attacks allows attackers to borrow votes for one block to swing a decision.
* **Solution:** Time-weighted voting power.
* **Formula:** `Voting Power = Amount Staked * Time Locked`.
* **Implementation:** `ConvictionStaking.sol` locks tokens. Power grows linearly over time until a max cap is reached. Users must unstake (forfeit power) to sell tokens.

### 4. Veto Council (Optimistic Security)

* **Problem:** Pure code-is-law is dangerous if a bug exists.
* **Solution:** A 2-of-3 Multisig of trusted Guardians.
* **Capability:** They cannot *pass* proposals, but they can *cancel* any proposal that is malicious or flagged as a bug exploit. This acts as a "human brake" on the autonomous system.

---

## ✅ Deployed Contracts (Verified)

All contracts have been deployed and fully verified on the **Sepolia Testnet**.

| Module | Contract Name | Verified Address | Status |
| --- | --- | --- | --- |
| **Core** | **DAO Core Registry** | [`0xf4ffd...8cf6`](https://sepolia.etherscan.io/address/0xf4ffd6558454c60E50ef97799C3D69758CB68cf6) | ✅ Verified |
|  | **Timelock Controller** | [`0xC4c57...6FCd`](https://sepolia.etherscan.io/address/0xC4c57946dE2b9b585d05D21423Eee82501466FCd) | ✅ Verified |
| **Gov** | **Governance Token** | [`0x7F787...ec1DB`](https://sepolia.etherscan.io/address/0x7F78740d138edEBC17334217b927F5c4D50ec1DB) | ✅ Verified |
|  | **Hybrid Governor** | [`0x24BC3...CAD3`](https://sepolia.etherscan.io/address/0x24BC3F0e1D0e8732Ce30fbf07EF36beCC9a9CAD3) | ✅ Verified |
|  | **Veto Council** | [`0x4Abd1...tnfh`](https://sepolia.etherscan.io/address/0x4Abd12fAED0eabc8cC7825b503EB2B853C8a5278) | ✅ Verified |
| **Fi** | **DAO Treasury** | [`0xE1131...1A4E`](https://sepolia.etherscan.io/address/0xE113199AE42eF5E9df14a455a67ACC26C8901A4E) | ✅ Verified |
| **Sec** | **Proposal Guard** | [`0xC4015...C3bE`](https://sepolia.etherscan.io/address/0xC4015518192B3f86bF9F27DDeBEd253267D9C3bE) | ✅ Verified |
|  | **Rage Quit** | [`0x2c26e...44a2`](https://sepolia.etherscan.io/address/0x2c26e0b0BdA62434aA4e694a767cF2643C7b44a2) | ✅ Verified |
| **Adv** | **Quadratic Funding** | [`0xFb045...b198`](https://sepolia.etherscan.io/address/0xFb0455c92908b57c978Fe4B7BE9D1f870B58b198) | ✅ Verified |

---

## 🛠️ Installation & Setup

This project uses **Foundry** for a blazingly fast development workflow.

```bash
# 1. Clone the repository
git clone [https://github.com/NexTechArchitect/Sentinel-DAO.git](https://github.com/NexTechArchitect/Sentinel-DAO.git)
cd Sentinel-DAO

# 2. Install Dependencies
forge install

# 3. Environment Setup
cp .env.example .env
# (Add your SEPOLIA_RPC_URL and PRIVATE_KEY in .env)

# 4. Build Project
make build

```

---

## 🧪 Testing & QA

We maintain a rigorous testing standard including Unit, Integration, and Fuzzing layers.

**Run All Tests:**

```bash
make test

```

**Run Integration Lifecycle:**
*Simulates the entire flow: Propose -> Vote -> Queue -> Execute*

```bash
make test-integration

```

**Run Fuzz Tests:**
*Stress tests the system with random inputs to find edge cases.*

```bash
forge test --match-path test/fuzz/*

```

---

## ⚠️ Disclaimer

**EDUCATIONAL ARCHITECTURE NOTICE:**

This repository serves as a reference implementation for advanced DAO patterns. While it utilizes production-grade libraries (OpenZeppelin) and verified architectural patterns:

1. **Audit Status:** This codebase has **NOT** undergone a formal security audit.
2. **Use at your own risk:** Do not use this code to secure real value on Mainnet without a comprehensive review.
3. **Experimental Features:** Modules like Quadratic Funding and Conviction Voting involve complex math that may have edge cases.

---

<div align="center">
<b>Built with ❤️ by NEXTECHARHITECT</b>

<i>Senior Smart Contract Developer · Solidity · Foundry · Web3 Security</i>

<a href="https://github.com/NexTechArchitect">GitHub</a> •
<a href="https://www.google.com/search?q=https://x.com/NexTechArchitect">Twitter</a>

</div>

```

```
