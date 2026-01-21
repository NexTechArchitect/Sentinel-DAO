-include .env

.PHONY: all test clean build install deploy-token deploy-timelock deploy-config deploy-governor wire help

# Default Network Arguments (Load from .env or override via command line)
NETWORK_ARGS := --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast

# ==============================================================================
#                                 HELPERS
# ==============================================================================

help:
	@echo "----------------------------------------------------------------"
	@echo "                     DAO DEPLOYMENT MAKEFILE"
	@echo "----------------------------------------------------------------"
	@echo "Usage:"
	@echo "  make build           : Compile contracts"
	@echo "  make test            : Run unit tests"
	@echo "  make test-fuzz       : Run fuzz tests (1000 runs)"
	@echo "  make clean           : Clean artifacts"
	@echo "  make fmt             : Auto-format solidity code"
	@echo ""
	@echo "Deployment (Sequential):"
	@echo "  1. make deploy-token : Deploy Governance Token"
	@echo "  2. make deploy-timelock : Deploy Timelock Controller"
	@echo "  3. make deploy-config   : Deploy DAO Config (Requires TIMELOCK_ADDRESS in .env)"
	@echo "  4. make deploy-governor : Deploy Governor (Requires TOKEN/TIMELOCK/CONFIG in .env)"
	@echo "  5. make wire            : Wire everything together"
	@echo "----------------------------------------------------------------"

# ==============================================================================
#                                 DEVELOPMENT
# ==============================================================================

all: clean remove install update build

clean:
	@echo "Cleaning artifacts..."
	@forge clean

build:
	@echo "Building contracts..."
	@forge build

fmt:
	@forge fmt

test:
	@echo "Running tests..."
	@forge test

test-fuzz:
	@echo "Running fuzz tests..."
	@forge test --fuzz-runs 1000

test-gas:
	@forge test --gas-report

# ==============================================================================
#                                 DEPLOYMENT
# ==============================================================================
# Note: Ensure you update your .env file with new addresses after each step.

deploy-token:
	@echo "Deploying Governance Token..."
	@forge script script/DeployGovernanceToken.s.sol:DeployGovernanceToken $(NETWORK_ARGS) -vvvv

deploy-timelock:
	@echo "Deploying Timelock..."
	@forge script script/DeployTimelock.s.sol:DeployTimelock $(NETWORK_ARGS) -vvvv

deploy-config:
	@echo "Deploying DAO Config..."
	@forge script script/DeployDAOConfig.s.sol:DeployDAOConfig $(NETWORK_ARGS) -vvvv

deploy-governor:
	@echo "Deploying Governor..."
	@forge script script/DeployGovernor.s.sol:DeployGovernor $(NETWORK_ARGS) -vvvv

wire:
	@echo "Wiring DAO Components..."
	@forge script script/WireDAO.s.sol:WireDAO $(NETWORK_ARGS) -vvvv

# ==============================================================================
#                                 VERIFICATION
# ==============================================================================

verify:
	@forge verify-contract --chain-id 11155111 --num-of-optimizations 200 --watch --constructor-args $(ARGS) $(CONTRACT_ADDRESS) $(PATH)