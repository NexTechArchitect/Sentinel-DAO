// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

/**
 * @title DAO Configuration Fuzz Suite
 * @notice Stress-tests configuration setters with random data and security checks.
 */
contract DAOConfigFuzzTest is Test {
    DAOConfig config;
    address internal constant TIMELOCK = address(100);

    // Initial Config Constants
    uint48 constant INIT_DELAY = 1;
    uint32 constant INIT_PERIOD = 7200; // 2 hours
    uint16 constant INIT_QUORUM = 4; // 4%
    uint256 constant INIT_THRESHOLD = 1000 ether;

    function setUp() public {
        config = new DAOConfig(
            TIMELOCK,
            INIT_DELAY,
            INIT_PERIOD,
            INIT_QUORUM,
            INIT_THRESHOLD
        );
    }

    /*//////////////////////////////////////////////////////////////
                        POSITIVE FUZZ TESTS (Happy Path)
    //////////////////////////////////////////////////////////////*/

    function testFuzz_UpdateVotingDelay(uint48 newDelay) public {
        // Constraint: Delay must be > 0
        vm.assume(newDelay > 0);
        // Constraint: Must be different from current
        vm.assume(newDelay != config.votingDelay());

        vm.prank(TIMELOCK);
        config.updateVotingDelay(newDelay);

        assertEq(config.votingDelay(), newDelay, "Voting delay mismatch");
    }

    function testFuzz_UpdateVotingPeriod(uint32 newPeriod) public {
        uint32 min = config.MIN_VOTING_PERIOD();
        uint32 max = config.MAX_VOTING_PERIOD();

        // Constraint: Must be within contract bounds
        newPeriod = uint32(bound(newPeriod, min, max));
        // Constraint: Must be different from current
        vm.assume(newPeriod != config.votingPeriod());

        vm.prank(TIMELOCK);
        config.updateVotingPeriod(newPeriod);

        assertEq(config.votingPeriod(), newPeriod, "Voting period mismatch");
    }

    function testFuzz_UpdateQuorum(uint16 newQuorum) public {
        // Constraint: Must be 1-100%
        newQuorum = uint16(bound(newQuorum, 1, 100));
        // Constraint: Must be different from current
        vm.assume(newQuorum != config.quorumPercentage());

        vm.prank(TIMELOCK);
        config.updateQuorum(newQuorum);

        assertEq(config.quorumPercentage(), newQuorum, "Quorum mismatch");
    }

    function testFuzz_UpdateProposalThreshold(uint256 newThreshold) public {
        // -----------------------------------------------------------
        // FIX: The contract forbids 0, so we must filter it out.
        // -----------------------------------------------------------
        vm.assume(newThreshold > 0);

        // Constraint: Must be different from current
        vm.assume(newThreshold != config.proposalThreshold());

        vm.prank(TIMELOCK);
        config.updateProposalThreshold(newThreshold);

        assertEq(
            config.proposalThreshold(),
            newThreshold,
            "Threshold mismatch"
        );
    }

    /*//////////////////////////////////////////////////////////////
                        NEGATIVE FUZZ TESTS (Security)
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RevertIf_RandomUserUpdates(
        address attacker,
        uint48 newDelay
    ) public {
        vm.assume(attacker != TIMELOCK);
        vm.assume(newDelay > 0);

        vm.prank(attacker);

        // Expect revert due to AccessControl
        vm.expectRevert();
        config.updateVotingDelay(newDelay);
    }
}
