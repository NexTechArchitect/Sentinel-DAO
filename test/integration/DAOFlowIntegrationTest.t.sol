// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {GovernanceToken} from "../../src/contracts/core/GovernanceToken.sol";
import {
    HybridGovernorDynamic
} from "../../src/contracts/core/HybridGovernorDynamic.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title DAO Governance Integration Suite
 * @author Architecture Team
 * @notice Comprehensive integration tests for the Hybrid Governance System.
 * @dev Validates the interaction between Governor, Timelock, and Treasury contracts
 * under various state conditions including quorum failure and time-locks.
 */
contract DAOFlowIntegrationTest is Test {
    /* -------------------------------------------------------------------------- */
    /* CONSTANTS                                  */
    /* -------------------------------------------------------------------------- */

    address internal constant DEPLOYER = address(0x1);
    address internal constant VOTER_1 = address(0x2);
    address internal constant VOTER_2 = address(0x3);
    address internal constant RECEIVER = address(0x4);

    uint256 internal constant INITIAL_VOTER_BALANCE = 4_000_000 ether;

    /* -------------------------------------------------------------------------- */
    /* STATE VARIABLES                              */
    /* -------------------------------------------------------------------------- */

    GovernanceToken internal token;
    TimelockController internal timelock;
    DAOConfig internal config;
    HybridGovernorDynamic internal governor;
    DAOTreasury internal treasury;

    /* -------------------------------------------------------------------------- */
    /* SETUP                                   */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Deploys the full governance suite and configures initial state.
     * @dev Mocks a production deployment by:
     * 1. Distributing tokens to simulated voters.
     * 2. Configuring the Timelock Controller.
     * 3. Granting the Governor contract the PROPOSER_ROLE.
     */
    function setUp() public {
        vm.startPrank(DEPLOYER);

        token = new GovernanceToken(DEPLOYER, DEPLOYER);
        token.mint(VOTER_1, INITIAL_VOTER_BALANCE);
        token.mint(VOTER_2, INITIAL_VOTER_BALANCE);

        vm.stopPrank();

        vm.prank(VOTER_1);
        token.delegate(VOTER_1);

        vm.prank(VOTER_2);
        token.delegate(VOTER_2);

        vm.startPrank(DEPLOYER);

        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0);
        executors[0] = address(0);

        timelock = new TimelockController(
            2 days,
            proposers,
            executors,
            DEPLOYER
        );

        config = new DAOConfig(address(timelock), 1, 45818, 4, 0);

        governor = new HybridGovernorDynamic(token, timelock, config);

        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        timelock.revokeRole(timelock.DEFAULT_ADMIN_ROLE(), DEPLOYER);

        treasury = new DAOTreasury(address(timelock));
        vm.deal(address(treasury), 10 ether);

        vm.stopPrank();
    }

    /* -------------------------------------------------------------------------- */
    /* HELPERS                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * @dev Generates a proposal to transfer funds from the Treasury.
     * @return proposalId Unique identifier of the created proposal.
     * @return targets List of target addresses for execution.
     * @return values List of ETH values to send.
     * @return calldatas encoded function calls.
     * @return descriptionHash Keccak256 hash of the description string.
     */
    function _createStandardProposal()
        internal
        returns (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            bytes32 descriptionHash
        )
    {
        targets = new address[](1);
        values = new uint256[](1);
        calldatas = new bytes[](1);

        targets[0] = address(treasury);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            DAOTreasury.transferETH.selector,
            payable(RECEIVER),
            5 ether
        );

        string memory description = "Proposal #1: Fund Community Grant";
        descriptionHash = keccak256(bytes(description));

        vm.prank(VOTER_1);
        proposalId = governor.propose(targets, values, calldatas, description);
    }

    /* -------------------------------------------------------------------------- */
    /* TEST SUITE                                 */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Verifies the standard lifecycle of a successful proposal.
     * @dev Steps: Propose -> Vote (Pass) -> Queue -> Wait Delay -> Execute.
     */
    function test_Governance_EndToEndExecution() public {
        (
            uint256 pid,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            bytes32 descHash
        ) = _createStandardProposal();

        vm.roll(block.number + config.votingDelay() + 1);

        vm.prank(VOTER_1);
        governor.castVote(pid, 1);
        vm.prank(VOTER_2);
        governor.castVote(pid, 1);

        vm.roll(block.number + config.votingPeriod() + 1);

        governor.queue(targets, values, calldatas, descHash);

        vm.warp(block.timestamp + 2 days + 1);

        uint256 balBefore = RECEIVER.balance;
        governor.execute(targets, values, calldatas, descHash);
        uint256 balAfter = RECEIVER.balance;

        assertEq(
            balAfter - balBefore,
            5 ether,
            "Treasury funds were not transferred correctly"
        );
    }

    /**
     * @notice Validates Timelock security enforcement.
     * @dev Expects revert when attempting execution before the minimum delay passes.
     */
    function test_RevertIf_TimelockDelayNotPassed() public {
        (
            uint256 pid,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            bytes32 descHash
        ) = _createStandardProposal();

        vm.roll(block.number + config.votingDelay() + 1);

        vm.prank(VOTER_1);
        governor.castVote(pid, 1);
        vm.prank(VOTER_2);
        governor.castVote(pid, 1);

        vm.roll(block.number + config.votingPeriod() + 1);
        governor.queue(targets, values, calldatas, descHash);

        vm.expectRevert();
        governor.execute(targets, values, calldatas, descHash);
    }

    /**
     * @notice Validates Quorum logic.
     * @dev Proposal must fail if total votes < 4% of supply.
     */
    function test_Governance_ProposalFails_QuorumNotReached() public {
        (uint256 pid, , , , ) = _createStandardProposal();

        vm.roll(block.number + config.votingDelay() + 1);

        vm.prank(VOTER_1);
        governor.castVote(pid, 1);

        vm.roll(block.number + config.votingPeriod() + 1);

        assertEq(
            uint256(governor.state(pid)),
            uint256(IGovernor.ProposalState.Defeated),
            "Proposal should be defeated due to insufficient quorum"
        );
    }

    /**
     * @notice Validates Majority logic.
     * @dev Proposal must fail if Against Votes >= For Votes.
     */
    function test_Governance_ProposalFails_MajorityAgainst() public {
        (uint256 pid, , , , ) = _createStandardProposal();

        vm.roll(block.number + config.votingDelay() + 1);

        vm.prank(VOTER_1);
        governor.castVote(pid, 1);

        vm.prank(VOTER_2);
        governor.castVote(pid, 0);

        vm.roll(block.number + config.votingPeriod() + 1);

        assertEq(
            uint256(governor.state(pid)),
            uint256(IGovernor.ProposalState.Defeated),
            "Proposal should fail when Against votes match For votes"
        );
    }
}
