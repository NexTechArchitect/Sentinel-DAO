
<div align="center">

# 🛡️ SENTINEL DAO
### Institutional Grade Governance Operating System

[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Full_Stack-Next.js_14_%7C_Foundry-blueviolet.svg)](https://nextjs.org)
[![Network](https://img.shields.io/badge/Network-Sepolia_Testnet-blue.svg)](https://sepolia.etherscan.io/)
[![Status](https://img.shields.io/badge/Security-Audited_Architecture-orange.svg)](https://github.com/NexTechArchitect)

<p align="center">
  <br>
  <b>A modular, protocol-level governance infrastructure designed for long-term institutional control.</b><br>
  <i>Engineered with Account Abstraction (ERC-4337), Real-time Treasury Telemetry, and Automated Yield Strategies.</i>
  <br>
</p>

[🚀 **Launch Dashboard**](https://sentinel-dao-brown.vercel.app/) • [💻 **View Source**](https://github.com/NexTechArchitect/Web3-FullStack-Sentinal-DAO) • [📜 **System Docs**](https://github.com/NexTechArchitect/Sentinel-DAO/tree/main/docs)

</div>

---

## 🧠 Design Philosophy

Sentinel DAO is not just a UI; it is **Critical Infrastructure Engineering**. It addresses specific failure modes observed in earlier DAO generations:

1.  **No Implicit Power:** The architecture follows a strict separation of concerns. No contract possesses implicit power over another. Even Admins cannot bypass the **TimelockController**.
2.  **Enforced Delays:** All state-changing proposals execute exclusively through a Timelock. This creates a transparent delay window, ensuring no governance decision is applied instantly.
3.  **Governance as an OS:** Modules (Voting Strategies, Yield Engines, Account Abstraction) can be swapped or upgraded without migrating the underlying asset-holding contracts.

---

## ✅ Smart Contract Deployment (Sepolia)

All contracts are deployed and verified on the **Sepolia Testnet**. Click the address to view the contract on Etherscan.

### 🔹 Core & Security Kernel
| Module | Contract Name | Contract Address |
| :--- | :--- | :--- |
| **Kernel** | **DAO Registry (Core)** | [**0xf4ffd...8cf6**](https://sepolia.etherscan.io/address/0xf4ffd6558454c60E50ef97799C3D69758CB68cf6) |
| **Security** | **Timelock Controller** | [**0xC4c57...6FCd**](https://sepolia.etherscan.io/address/0xC4c57946dE2b9b585d05D21423Eee82501466FCd) |
| **Security** | **Role Manager (RBAC)** | [**0xa5720...9d8F**](https://sepolia.etherscan.io/address/0xa5720e4434da10b6c47D8D84542d5a77861A9d8F) |
| **Config** | **DAO Configuration** | [**0x2DE65...6EC1**](https://sepolia.etherscan.io/address/0x2DE65ABEA5dC9C0f18a4975e07E281a2a25C6EC1) |
| **Security** | **Emergency Pause** | [**0x54078...Ba96**](https://sepolia.etherscan.io/address/0x5407869765C92dA9c3B039979170aaBFFaB3Ba96) |

### 🔹 Governance Engine
| Module | Contract Name | Contract Address |
| :--- | :--- | :--- |
| **Gov** | **Hybrid Governor** | [**0x24BC3...CAD3**](https://sepolia.etherscan.io/address/0x24BC3F0e1D0e8732Ce30fbf07EF36beCC9a9CAD3) |
| **Token** | **Governance Token** | [**0x7F787...c1DB**](https://sepolia.etherscan.io/address/0x7F78740d138edEBC17334217b927F5c4D50ec1DB) |
| **Guard** | **Proposal Guard** | [**0xC4015...C3bE**](https://sepolia.etherscan.io/address/0xC4015518192B3f86bF9F27DDeBEd253267D9C3bE) |
| **Veto** | **Veto Council** | [**0x4Abd1...5278**](https://sepolia.etherscan.io/address/0x4Abd12fAED0eabc8cC7825b503EB2B853C8a5278) |
| **Exit** | **Rage Quit Module** | [**0x2c26e...44a2**](https://sepolia.etherscan.io/address/0x2c26e0b0BdA62434aA4e694a767cF2643C7b44a2) |

### 🔹 Financial Treasury
| Module | Contract Name | Contract Address |
| :--- | :--- | :--- |
| **Vault** | **Main Treasury** | [**0xE1131...1A4E**](https://sepolia.etherscan.io/address/0xE113199AE42eF5E9df14a455a67ACC26C8901A4E) |
| **Yield** | **Aave V3 Strategy** | [**0x843ab...b524**](https://sepolia.etherscan.io/address/0x843abAd0B13436b93E7ab71e075bED679586b524) |
| **Grants** | **Quadratic Funding** | [**0xFb045...b198**](https://sepolia.etherscan.io/address/0xFb0455c92908b57c978Fe4B7BE9D1f870B58b198) |

### 🔹 Account Abstraction (ERC-4337)
| Module | Contract Name | Contract Address |
| :--- | :--- | :--- |
| **AA** | **Account Factory** | [**0x7B587...9E96e**](https://sepolia.etherscan.io/address/0x7B587a4A5F571486f4A8dc1bd6aDB745F71fE96e) |
| **AA** | **Gasless Paymaster** | [**0x6927f...E9cD**](https://sepolia.etherscan.io/address/0x6927fc2B44008b5D05611194d47fa3451f9fE9cD) |
| **AA** | **Session Key Module** | [**0xA8F12...95Fa**](https://sepolia.etherscan.io/address/0xA8F129d87Ba978aedFbd40D764445a706dAA95Fa) |
| **Core** | **Entry Point** | [**0x5FF13...2789**](https://sepolia.etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789) |

---

## 🏛️ System Architecture

Sentinel DAO is architected as a **Full-Stack Decentralized Application**. It strictly separates the **Solidity Kernel** (Logic & State) from the **Next.js Client** (Interaction & Telemetry), connected via strictly typed hooks.

### 📂 Architectural Topology
```bash
Sentinel-DAO/
├── contracts/              # SOLIDITY KERNEL (Foundry)
│   ├── core/               # Registry, Timelock, Access Control
│   ├── governance/         # Voting Logic, Token Standards
│   ├── aa/                 # ERC-4337 Smart Wallets
│   └── treasury/           # Vaults & Yield Strategies
│
└── web3-app/               # CLIENT APPLICATION (Next.js 14)
    ├── src/app/            # App Router & Pages
    ├── src/hooks/          # Custom Web3 Logic (Wagmi/Viem)
    └── src/config/         # Constants & ABI Bindings

```

---

## 🖥️ Frontend Engineering (Client)

The frontend is built on **Next.js 14 (App Router)**, utilizing a modular provider pattern to manage blockchain state without a centralized backend.

### Tech Stack

* **Framework:** Next.js 14 (TypeScript)
* **Styling:** Tailwind CSS + Framer Motion (8K Animations)
* **Web3 Hooks:** Wagmi v2 + Viem
* **Auth:** RainbowKit (ConnectButton)
* **Infrastructure:** Public RPC Nodes (Zero API Key dependency)

### Directory Breakdown (`src/`)

| Directory | Role & Responsibility |
| --- | --- |
| **`app/`** | **Routing & Pages.** Each folder (`/treasury`, `/proposals`, `/guardian`) represents a distinct module using Server Components for performance. |
| **`components/`** | **UI Atoms.** Reusable UI elements. Includes `SessionGuard.tsx` which protects routes based on wallet connection and AA session status. |
| **`hooks/`** | **Business Logic.** Custom React Hooks wrapping Wagmi/Viem: <br>

<br>• `useAASession.ts`: Manages Account Abstraction session keys.<br>

<br>• `useDAOData.ts`: Fetches real-time governance metrics.<br>

<br>• `useProposals.ts`: Handles proposal lifecycle (Submit -> Vote -> Queue). |
| **`config/`** | **System Configuration.** Contains `constants.ts` with verified Contract Addresses, ABIs, and RPC configurations. |

---

## 🧩 Core Modules & Functionality

### 1. Autonomous Treasury & Yield

The financial engine is designed for active management.

* **Multi-Asset Vault:** Supports ETH, ERC-20, and NFTs with "Pull-Payment" architecture.
* **Yield Optimization:** An automated module integrates with **Aave V3**. Idle treasury assets are programmatically deposited into lending pools to generate yield, ensuring the treasury grows over time.

### 2. Account Abstraction (ERC-4337)

Abstracts blockchain complexity from the end-user.

* **Smart Accounts:** Deploys deterministic Smart Accounts for users via `DAOAccountFactory`.
* **Gasless Voting:** A protocol-funded `Paymaster` sponsors gas fees for governance actions.
* **Session Keys:** Users sign once to start a session and perform multiple actions without repeated wallet popups.

### 3. Sentinel Security Layer

* **Veto Council:** A specialized multisig of trusted guardians who can cancel malicious proposals.
* **Emergency Pause:** A circuit breaker that freezes the protocol in the event of a zero-day exploit.
* **Rage Quit:** Minority protection mechanism allowing dissenters to exit with their share of the treasury.

---

## 🛠️ Installation & Setup

To run the full stack environment locally:

### 1. Smart Contracts (Foundry)

```bash
# Clone Repo
git clone [https://github.com/NexTechArchitect/Web3-FullStack-Sentinal-DAO.git](https://github.com/NexTechArchitect/Web3-FullStack-Sentinal-DAO.git)
cd Web3-FullStack-Sentinal-DAO

# Install Dependencies
forge install

# Run Tests
forge test

```

### 2. Client Application (Next.js)

```bash
cd web3-app

# Install Node Modules
npm install

# Run Development Server
npm run dev

```

Open `http://localhost:3000` to view the Dashboard.

---

## ⚠️ Disclaimer

**EDUCATIONAL ARCHITECTURE NOTICE:**
This repository serves as a reference implementation for advanced DAO patterns. While it utilizes production-grade libraries and verified patterns, this codebase has **NOT** undergone a formal external security audit. Use at your own risk.

---

<div align="center">
<b>Built with ❤️ by <a href="https://www.google.com/url?sa=E&source=gmail&q=https://github.com/NexTechArchitect">NexTech Architect</a></b>




<i>Senior Smart Contract Developer · Solidity · Foundry · Full Stack Web3</i>
</div>

```

```
