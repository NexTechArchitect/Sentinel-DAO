// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {ConvictionVoting} from "../../src/contracts/governance/ConvictionVoting.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ZeroAmount} from "../../src/contracts/errors/CommonErrors.sol";

contract MockVoteToken is ERC20 {
    constructor() ERC20("Vote", "VOTE") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }
}

contract ConvictionVotingTest is Test {
    ConvictionVoting public voting;
    MockVoteToken public token;

    address public user1 = makeAddr("user1");
    address public roleManager = makeAddr("roleManager");

    function setUp() public {
        token = new MockVoteToken();
        voting = new ConvictionVoting(address(token), roleManager);

        bool success = token.transfer(user1, 1000 * 10**18);
        assertTrue(success, "Setup transfer failed");
        
        vm.prank(user1);
        token.approve(address(voting), type(uint256).max);
    }

   
    function test_Vote_NoLock() public {
        vm.startPrank(user1);
        uint128 amount = 100 * 10**18;
        
        voting.castVote(1, amount, 0);

        (uint128 staked, uint128 power, ) = voting.getVoterState(1, user1);
        
        assertEq(staked, amount);
        assertEq(power, amount);
        
        vm.stopPrank();
    }

    function test_Vote_MaxLock() public {
        vm.startPrank(user1);
        uint128 amount = 100 * 10**18;
        uint256 lockDays = 365 * 4; 

        voting.castVote(1, amount, lockDays);

        (uint128 staked, uint128 power, uint48 lockedUntil) = voting.getVoterState(1, user1);
        
        assertEq(staked, amount);
        assertEq(power, amount * 4); 
        assertEq(lockedUntil, block.timestamp + (lockDays * 1 days));
        
        vm.stopPrank();
    }

    function test_Withdraw_Success() public {
        vm.startPrank(user1);
        voting.castVote(1, 100 * 10**18, 10); 
        vm.expectRevert(abi.encodeWithSelector(ConvictionVoting.LockActive.selector, block.timestamp + 10 days));
        voting.withdrawVote(1);

        vm.warp(block.timestamp + 10 days + 1);
        
        voting.withdrawVote(1);
        
        assertEq(token.balanceOf(user1), 1000 * 10**18); // Full Refund
        
        vm.stopPrank();
    }

    function test_Reverts() public {
        vm.startPrank(user1);
        
        vm.expectRevert(ZeroAmount.selector);
        voting.castVote(1, 0, 0);

        vm.expectRevert(ConvictionVoting.InvalidLockDuration.selector);
        voting.castVote(1, 100, 365 * 5);
        
        vm.expectRevert(ConvictionVoting.NoStakeFound.selector);
        voting.withdrawVote(99);

        vm.stopPrank();
    }
}