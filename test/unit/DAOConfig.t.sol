// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";
import {InvalidValue, SameValue} from "../../src/contracts/errors/CommonErrors.sol";
import {OnlyTimelock} from "../../src/contracts/errors/GovernanceErrors.sol";

contract DAOConfigTest is Test {
    DAOConfig public config;
    address public timelock = makeAddr("timelock");
    address public hacker = makeAddr("hacker");

    
    event ConfigUpdated(string indexed param, uint256 newValue);

    function setUp() public {
        config = new DAOConfig(
            timelock,
            1 days,   
            1 weeks, 
            100e18,   
            4        
        );
    }

    function test_InitialState() public view {
        assertEq(config.TIMELOCK(), timelock);
        assertEq(config.votingDelay(), 1 days);
        assertEq(config.votingPeriod(), 1 weeks);
        assertEq(config.proposalThreshold(), 100e18);
        assertEq(config.quorumPercentage(), 4);
    }

    function test_SetVotingDelay_Success() public {
        uint256 newDelay = 2 days;

        vm.prank(timelock);
        
       
        vm.expectEmit(true, false, false, true); 
        emit ConfigUpdated("votingDelay", newDelay);

        config.setVotingDelay(newDelay);
        assertEq(config.votingDelay(), newDelay);
    }

    function test_RevertIf_SetVotingDelay_Unauthorized() public {
        vm.prank(hacker);
        vm.expectRevert(OnlyTimelock.selector);
        config.setVotingDelay(2 days);
    }

    function test_RevertIf_SetVotingDelay_SameValue() public {
        vm.startPrank(timelock);
        vm.expectRevert(SameValue.selector);
        config.setVotingDelay(1 days);
        vm.stopPrank();
    }

    function test_SetVotingPeriod_Success() public {
        uint256 newPeriod = 2 weeks;

        vm.prank(timelock);

      
        vm.expectEmit(true, false, false, true);
        emit ConfigUpdated("votingPeriod", newPeriod);

        config.setVotingPeriod(newPeriod);
        assertEq(config.votingPeriod(), newPeriod);
    }

    function test_RevertIf_SetVotingPeriod_Unauthorized() public {
        vm.prank(hacker);
        vm.expectRevert(OnlyTimelock.selector);
        config.setVotingPeriod(2 weeks);
    }

    function test_SetProposalThreshold_Success() public {
        uint256 newThreshold = 200e18;

        vm.prank(timelock);
        
        
        vm.expectEmit(true, false, false, true);
        emit ConfigUpdated("proposalThreshold", newThreshold);

        config.setProposalThreshold(newThreshold);
        assertEq(config.proposalThreshold(), newThreshold);
    }

    function test_RevertIf_SetProposalThreshold_SameValue() public {
        vm.prank(timelock);
        vm.expectRevert(SameValue.selector);
        config.setProposalThreshold(100e18);
    }

    function test_SetQuorumPercentage_Success() public {
        uint256 newQuorum = 10;

        vm.prank(timelock);
        
       
        vm.expectEmit(true, false, false, true);
        emit ConfigUpdated("quorumPercentage", newQuorum);

        config.setQuorumPercentage(newQuorum);
        assertEq(config.quorumPercentage(), newQuorum);
    }

    function test_RevertIf_QuorumExceeds100() public {
        vm.prank(timelock);
        vm.expectRevert(InvalidValue.selector);
        config.setQuorumPercentage(101);
    }

    function test_RevertIf_TimelockZeroAddress() public {
        vm.expectRevert(InvalidValue.selector);
        new DAOConfig(address(0), 1, 1, 1, 1);
    }
}