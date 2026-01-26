-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

help:
	@echo "-----------------------------------------------------------------"
	@echo "                    FOUNDRY DAO MAKEFILE                         "
	@echo "-----------------------------------------------------------------"
	@echo "Usage:"
	@echo "  make build           : Compile contracts"
	@echo "  make test            : Run all tests"
	@echo "  make test-unit       : Run only unit tests"
	@echo "  make test-integration: Run only integration tests"
	@echo "  make clean           : Clean artifacts"
	@echo "  make snapshot        : Generate gas snapshot"
	@echo "  make format          : Auto-format Solidity code"
	@echo "-----------------------------------------------------------------"
	@echo "                     DEPLOYMENT (SEPOLIA)                        "
	@echo "-----------------------------------------------------------------"
	@echo "  make deploy-base     : Phase 1 (RoleManager, GovToken)"
	@echo "  make deploy-timelock : Phase 2 (Timelock, UpgradeExecutor)"
	@echo "  make deploy-config   : Phase 3 (DAOConfig)"
	@echo "  make deploy-gov      : Phase 4 (Governor, VetoCouncil)"
	@echo "  make deploy-treasury : Phase 5 (Treasury, YieldStrategy)"
	@echo "  make deploy-security : Phase 6 (RageQuit, Guard, Pause)"
	@echo "  make deploy-advanced : Phase 7 (QF, Conviction, Staking)"
	@echo "  make deploy-offchain : Phase 8 (Offchain Executor, Snapshot)"
	@echo "  make deploy-core     : Phase 9 (Core Registry)"
	@echo "  make wire-dao        : Phase 10 (Final Wiring)"
	@echo "-----------------------------------------------------------------"
	@echo "                     POST-DEPLOYMENT                             "
	@echo "-----------------------------------------------------------------"
	@echo "  make fund-treasury   : Send tokens to Treasury"
	@echo "  make delegate        : Self-delegate votes"
	@echo "  make propose         : Create a proposal"
	@echo "  make cast-vote       : Cast a vote (After delay)"
	@echo "-----------------------------------------------------------------"

# --- SETUP & TOOLS ---

all: clean remove install update build

# Install dependencies
install:; forge install

# Update dependencies
update:; forge update

# Compile contracts
build:; forge build

# Clean artifacts
clean:; forge clean

# Generate Gas Snapshot
snapshot:; forge snapshot

# Format Code
format:; forge fmt

# --- TESTING ---

test:
	forge test

test-unit:
	forge test --match-path test/unit/*

test-integration:
	forge test --match-path test/integration/*

test-gas:
	forge test --gas-report

# --- DEPLOYMENT ARGS (SEPOLIA) ---
# Automatically loads RPC and Key from .env
NETWORK_ARGS := --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

# --- DEPLOYMENT PHASES ---

deploy-base:
	@source .env && forge script script/deployment/01_DeployBase.s.sol:DeployBase $(NETWORK_ARGS)

deploy-timelock:
	@source .env && forge script script/deployment/02_DeployTimelock.s.sol:DeployTimelock $(NETWORK_ARGS)

deploy-config:
	@source .env && forge script script/deployment/03_DeployConfig.s.sol:DeployConfig $(NETWORK_ARGS)

deploy-gov:
	@source .env && forge script script/deployment/04_DeployGovernance.s.sol:DeployGovernance $(NETWORK_ARGS)

deploy-treasury:
	@source .env && forge script script/deployment/05_DeployTreasury.s.sol:DeployTreasury $(NETWORK_ARGS)

deploy-security:
	@source .env && forge script script/deployment/06_DeploySecurity.s.sol:DeploySecurity $(NETWORK_ARGS)

deploy-advanced:
	@source .env && forge script script/deployment/07_DeployAdvancedVoting.s.sol:DeployAdvancedVoting $(NETWORK_ARGS)

deploy-offchain:
	@source .env && forge script script/deployment/08_DeployOffchain.s.sol:DeployOffchain $(NETWORK_ARGS)

deploy-core:
	@source .env && forge script script/deployment/09_DeployCore.s.sol:DeployCore $(NETWORK_ARGS)

wire-dao:
	@source .env && forge script script/deployment/10_WireDAO.s.sol:WireDAO $(NETWORK_ARGS)

# --- POST DEPLOYMENT ACTIONS ---

fund-treasury:
	@source .env && forge script script/deployment/11_FundTreasury.s.sol:FundTreasury $(NETWORK_ARGS)

delegate:
	@source .env && forge script script/deployment/12_DelegateOnly.s.sol:DelegateOnly $(NETWORK_ARGS)

propose:
	@source .env && forge script script/deployment/13_SubmitProposal.s.sol:SubmitProposal $(NETWORK_ARGS)

cast-vote:
	@source .env && forge script script/deployment/15_CastVote.s.sol:CastVote $(NETWORK_ARGS)

# --- VERIFICATION HELPERS ---

verify-timelock:
	forge verify-contract --chain sepolia --watch $(TIMELOCK_ADDRESS) src/contracts/core/DAOTimelock.sol:DAOTimelock

verify-config:
	forge verify-contract --chain sepolia --watch $(CONFIG_ADDRESS) src/contracts/config/DAOConfig.sol:DAOConfig

verify-gov:
	forge verify-contract --chain sepolia --watch $(GOVERNOR_ADDRESS) src/contracts/core/HybridGovernorDynamic.sol:HybridGovernorDynamic