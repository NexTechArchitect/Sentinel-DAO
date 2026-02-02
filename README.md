

# <h1 align="center">🛡️ Sentinel DAO</h1>

<p align="center">
<a href="[https://getfoundry.sh/](https://getfoundry.sh/)">
<img src="[https://img.shields.io/badge/Built%20with-Foundry-orange](https://img.shields.io/badge/Built%20with-Foundry-orange)" alt="Foundry">
</a>
<a href="[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)">
<img src="[https://img.shields.io/badge/License-MIT-blue](https://img.shields.io/badge/License-MIT-blue)" alt="License">
</a>
<a href="">
<img src="[https://img.shields.io/badge/Network-Sepolia-grey](https://img.shields.io/badge/Network-Sepolia-grey)" alt="Network">
</a>
</p>

<p align="center">
<strong>A modular, protocol-level governance infrastructure designed for long-term institutional control.</strong>
</p>

---

**Sentinel DAO** is not a UI-driven product; it is a rigorous governance framework. It is engineered to control treasury assets, protocol upgrades, and system parameters through enforced execution rules. The architecture strictly separates state from logic, ensuring that complex voting strategies cannot compromise the security of the treasury.

Recently upgraded to include **Account Abstraction (ERC-4337)**, Sentinel DAO now supports frictionless, gasless participation while maintaining immutable on-chain security.

[View Deployed Contracts](https://www.google.com/search?q=%23-deployed-contracts-verified) • [System Architecture](https://www.google.com/search?q=%23-system-architecture) • [Testing Report](https://www.google.com/search?q=%23-testing--quality-assurance)

---

## 📑 Table of Contents

1. **[Design Philosophy](https://www.google.com/search?q=%23-design-philosophy)**
2. **[System Architecture](https://www.google.com/search?q=%23-system-architecture)**
3. **[Architectural Topology](https://www.google.com/search?q=%23-architectural-topology)**
4. **[Core Modules & Functionality](https://www.google.com/search?q=%23-core-modules--functionality)**
5. **[Testing & Quality Assurance](https://www.google.com/search?q=%23-testing--quality-assurance)**
6. **[Deployed Contracts](https://www.google.com/search?q=%23-deployed-contracts-verified)**
7. **[Engineering Standards](https://www.google.com/search?q=%23-engineering-standards)**
8. **[Installation & Setup](https://www.google.com/search?q=%23-installation--setup)**
9. **[Disclaimer](https://www.google.com/search?q=%23-disclaimer)**

---

## 🧠 Design Philosophy

Sentinel DAO approaches governance as "Critical Infrastructure Engineering." It addresses specific failure modes observed in earlier DAO generations:

* **No Implicit Power:** The architecture follows a strict separation of concerns. No contract possesses implicit power over another, and no privileged role (including Admins) can bypass the `TimelockController`.
* **Enforced Delays:** All state-changing proposals execute exclusively through a Timelock. This creates a transparent delay window, ensuring no governance decision is applied instantly, giving stakeholders time to react.
* **Governance as an OS:** The system is designed to be the "Operating System" for an organization. Modules (like Voting Strategies or Yield Engines) can be swapped or upgraded without migrating the underlying asset-holding contracts.

---

## 🏛️ System Architecture

The system is anchored by a **Hybrid Governor**. While it leverages OpenZeppelin's battle-tested foundation, it is strictly modular. Unlike monolithic DAOs, the Voting Logic, Execution, Treasury Control, and User Onboarding (AA) are isolated into separate components. This ensures that complex voting strategies cannot accidentally bypass treasury security boundaries.

---

## 📂 Architectural Topology

The codebase is organized into logical domains. Instead of a monolithic structure, we separate the **Kernel** (State) from the **Plugins** (Logic).

```text
src/contracts
├── core/                # THE KERNEL (Registry, Timelock, Treasury)
├── governance/          # CONSENSUS LAYER (Voting Logic, Tokens, Veto)
├── aa/                  # USER ABSTRACTION (Smart Wallets, Paymaster)
├── security/            # DEFENSE SYSTEMS (Emergency Pause, Analytics, RBAC)
├── treasury/            # ASSET MANAGEMENT (Vaults & Yield Strategies)
├── config/              # DYNAMIC CONFIG (Quorums, Thresholds)
├── delegation/          # DELEGATION (Voting Power Management)
├── offchain/            # BRIDGES (Snapshot X & Oracle Adapters)
└── upgrades/            # LIFECYCLE (UUPS Proxy Management)

```

---

## 🧩 Core Modules & Functionality

### 1. Kernel & Configuration

The "Brain" of the DAO. These contracts manage permissions and system parameters.

* **`DAOCore` (Registry):** Acts as the central source of truth. It maintains the registry of all active modules. If a contract is not registered here, it is not part of the DAO.
* **`RoleManager` (RBAC):** Implements granular Access Control. Unlike simple `Ownable` contracts, this allows for specific roles (e.g., `PROPOSER_ROLE`, `EXECUTOR_ROLE`, `GUARDIAN_ROLE`).
* **`DAOConfig`:** A dedicated contract for dynamic tuning. It allows the DAO to adjust critical parameters (like Voting Period, Quorum Percentage, or Proposal Thresholds) without requiring a full contract upgrade.

### 2. Governance Engines

The system moves beyond simple "1 Token = 1 Vote" mechanics.

* **`HybridGovernorDynamic`:** The central voting engine. It supports modular voting strategies, allowing proposals to use different counting mechanisms based on their category.
* **`VotingStrategies`:** Pluggable logic for calculating voting power. Includes **Quadratic Voting** (to reduce whale dominance) and **Conviction Voting** (time-weighted voting).
* **`ProposalGuard`:** An anti-spam middleware. It enforces reputation checks and cooldown periods before a user can submit a proposal, preventing "Governance Griefing" attacks.

### 3. Autonomous Treasury

The financial engine is designed for active management, not just passive storage.

* **`DAOTreasury`:** The main vault. It supports ETH, ERC-20, ERC-721, and ERC-1155 assets. It features "Pull-Payment" architecture to prevent reentrancy attacks during transfers.
* **`TreasuryYieldStrategy`:** An automated module that integrates with **Aave V3**. Idle treasury assets are programmatically deposited into lending pools to generate yield, ensuring the treasury grows over time.

### 4. Account Abstraction (ERC-4337)

A newly integrated layer designed to abstract blockchain complexity from the end-user.

* **`DAOAccountFactory`:** Deploys deterministic Smart Accounts for users. This allows for social recovery and advanced permission handling at the user level.
* **`DAOPayMaster`:** A protocol-funded contract that sponsors gas fees. This enables a "Gasless Voting" experience where the DAO covers the transaction costs for its members.
* **`SessionKeyModule`:** Implements temporary, scoped permissions (e.g., "Valid for 12 hours"). Users sign once to start a session and can perform multiple governance actions without repeated wallet popups.

### 5. Sentinel Security Layer

Active defense mechanisms to protect against malicious governance captures.

* **`VetoCouncil`:** A specialized multisig of trusted guardians who can cancel malicious proposals *before* they execute. This power is limited to vetoing, not creating proposals.
* **`EmergencyPause`:** A circuit breaker that freezes the protocol in the event of a zero-day exploit. It has a hardcoded time expiry to prevent permanent lockouts.
* **`RageQuit`:** The ultimate minority protection. If a malicious proposal passes, dissenters can burn their governance tokens to withdraw their proportional share of the treasury assets before the proposal executes.

---

## 🧪 Testing & Quality Assurance

The system has undergone a rigorous multi-layered testing strategy using the Foundry framework, executing over **160+ tests** with zero failures.

### 🛠️ Test Methodology

1. **Unit Tests:** Isolated testing of individual functions (e.g., `test_DepositERC20`, `test_GrantRoleBatch`) to ensure atomic logic correctness.
2. **Integration Tests:** Validating the interaction between modules (e.g., `DAOIntegration_Lifecycle` validates the full flow from Proposal -> Vote -> Queue -> Execute).
3. **Fuzz Testing:** Using property-based testing to throw random data at the system to find edge cases.
* *Result:* `testFuzz_EndToEndChaos` passed with 256 runs, simulating complex, high-entropy system states involving random user actions and state changes.
* *Result:* `testFuzz_RageQuitMath` verified the mathematical solvency of the exit mechanism under various economic conditions.


4. **Security Tests:** Specific test suites (`DAOIntegration_Setup`) ensure that access controls cannot be bypassed and that the Core system locks down correctly after initialization.

---

## ✅ Deployed Contracts (Verified)

All contracts have been deployed and verified on the **Sepolia Testnet**.

| Module | Contract Name | Verified Address | Status |
| --- | --- | --- | --- |
| **Core** | **DAO Registry** | [0xf4ffd...8cf6](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0xf4ffd6558454c60E50ef97799C3D69758CB68cf6) | ✅ Verified |
| **Core** | **Timelock Controller** | [0xC4c57...6FCd](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0xC4c57946dE2b9b585d05D21423Eee82501466FCd) | ✅ Verified |
| **Core** | **Treasury Vault** | [0xE1131...1A4E](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0xE113199AE42eF5E9df14a455a67ACC26C8901A4E) | ✅ Verified |
| **Gov** | **Hybrid Governor** | [0x24BC3...CAD3](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x24BC3F0e1D0e8732Ce30fbf07EF36beCC9a9CAD3) | ✅ Verified |
| **Gov** | **Governance Token** | [0x7F787...ec1DB](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x7F78740d138edEBC17334217b927F5c4D50ec1DB) | ✅ Verified |
| **Gov** | **Proposal Guard** | [0xC4015...C3bE](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0xC4015518192B3f86bF9F27DDeBEd253267D9C3bE) | ✅ Verified |
| **Sec** | **Veto Council** | [0x4Abd1...tnfh](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x4Abd12fAED0eabc8cC7825b503EB2B853C8a5278) | ✅ Verified |
| **Sec** | **Emergency Pause** | [0x54078...Ba96](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x5407869765C92dA9c3B039979170aaBFFaB3Ba96) | ✅ Verified |
| **Sec** | **Rage Quit** | [0x2c26e...44a2](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x2c26e0b0BdA62434aA4e694a767cF2643C7b44a2) | ✅ Verified |
| **Fi** | **Yield Strategy** | [0x843ab...b524](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x843abAd0B13436b93E7ab71e075bED679586b524) | ✅ Verified |
| **AA** | **Account Factory** | [0x7B587...9E96e](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x7B587a4A5F571486f4A8dc1bd6aDB745F71fE96e) | ✅ Verified |
| **AA** | **Gasless Paymaster** | [0x6927f...E9cD](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x6927fc2B44008b5D05611194d47fa3451f9fE9cD) | ✅ Verified |
| **Off** | **Offchain Executor** | [0x3a40D...996F](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x3a40D29433453e241415f822364Afdf0a7d5996F) | ✅ Verified |
| **Off** | **Delegation Registry** | [0x891ad...6B68](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0x891addA9FfC646e5CB67015F5F6e667741b76B68) | ✅ Verified |
| **Adv** | **Quadratic Funding** | [0xFb045...b198](https://www.google.com/search?q=https://sepolia.etherscan.io/address/0xFb0455c92908b57c978Fe4B7BE9D1f870B58b198) | ✅ Verified |

---

## ⚙️ Engineering Standards

This codebase adheres to production-grade Solidity practices:

* **Gas Optimization:** Usage of custom errors (`error Unauthorized()`), `unchecked` arithmetic where safe, and storage packing.
* **Explicit Access Control:** Every state-changing function is guarded by `RoleManager` or `Timelock`. There are no "god mode" EOA (Externally Owned Account) admins.
* **Upgradeability:** The system uses UUPS (Universal Upgradeable Proxy Standard) for the Core and Governor, allowing for logic patches without migrating state, while ensuring the Upgrade implementation itself is governed by the DAO.

---

## 🛠️ Installation & Setup

**Prerequisites:** [Foundry Toolchain](https://getfoundry.sh/)

```bash
# 1. Clone the repository
git clone https://github.com/NexTechArchitect/Sentinel-DAO.git
cd Sentinel-DAO

# 2. Install Dependencies
forge install

# 3. Build Project
forge build

# 4. Run Tests
# Runs the full suite including Fuzzing
forge test

```

---

## ⚠️ Disclaimer

**EDUCATIONAL ARCHITECTURE NOTICE:**

This repository serves as a reference implementation for advanced DAO patterns. While it utilizes production-grade libraries (OpenZeppelin) and verified architectural patterns:

* **Audit Status:** This codebase has NOT undergone a formal security audit.
* **Use at your own risk:** Do not use this code to secure real value on Mainnet without a comprehensive independent review.

---

**Built with ❤️ by NEXTECHARHITECT**
*Senior Smart Contract Developer · Solidity · Foundry · Web3 Engineer*

[GitHub](https://github.com/NexTechArchitect) • [X (Twitter)](https://x.com/itZ_AmiT0)
