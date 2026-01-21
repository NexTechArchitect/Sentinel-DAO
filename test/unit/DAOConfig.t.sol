// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/contracts/config/DAOConfig.sol";

contract DAOConfigTest is Test {
    DAOConfig config;

    address timelock = address(11);
    address attacker = address(22);

    function setUp() public {
        config = new DAOConfig(timelock, 10, 7200, 4, 1_000e18);
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    function test_constructor_sets_values() public view {
        assertEq(config.votingDelay(), 10);
        assertEq(config.votingPeriod(), 7200);
        assertEq(config.quorumPercentage(), 4);
        assertEq(config.proposalThreshold(), 1_000e18);
        assertEq(config.timelock(), timelock);
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL
    //////////////////////////////////////////////////////////////*/

    function test_only_timelock_can_update() public {
        vm.prank(attacker);
        vm.expectRevert(DAOConfig.OnlyTimelock.selector);
        config.updateVotingDelay(20);
    }

    /*//////////////////////////////////////////////////////////////
                        VOTING DELAY
    //////////////////////////////////////////////////////////////*/

    function test_update_voting_delay() public {
        vm.prank(timelock);
        config.updateVotingDelay(20);

        assertEq(config.votingDelay(), 20);
    }

    function test_revert_same_voting_delay() public {
        vm.prank(timelock);
        vm.expectRevert(DAOConfig.SameValue.selector);
        config.updateVotingDelay(10);
    }

    /*//////////////////////////////////////////////////////////////
                        VOTING PERIOD
    //////////////////////////////////////////////////////////////*/

    function test_update_voting_period() public {
        vm.prank(timelock);
        config.updateVotingPeriod(10000);

        assertEq(config.votingPeriod(), 10000);
    }

    function test_revert_invalid_voting_period() public {
        vm.prank(timelock);
        vm.expectRevert(DAOConfig.InvalidValue.selector);
        config.updateVotingPeriod(100);
    }

    /*//////////////////////////////////////////////////////////////
                            QUORUM
    //////////////////////////////////////////////////////////////*/

    function test_update_quorum() public {
        vm.prank(timelock);
        config.updateQuorum(10);

        assertEq(config.quorumPercentage(), 10);
    }

    function test_revert_invalid_quorum() public {
        vm.prank(timelock);
        vm.expectRevert(DAOConfig.InvalidValue.selector);
        config.updateQuorum(0);
    }

    /*//////////////////////////////////////////////////////////////
                    PROPOSAL THRESHOLD
    //////////////////////////////////////////////////////////////*/

    function test_update_proposal_threshold() public {
        vm.prank(timelock);
        config.updateProposalThreshold(5_000e18);

        assertEq(config.proposalThreshold(), 5_000e18);
    }

    function test_revert_zero_threshold() public {
        vm.prank(timelock);
        vm.expectRevert(DAOConfig.InvalidValue.selector);
        config.updateProposalThreshold(0);
    }
}
