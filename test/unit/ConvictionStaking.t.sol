// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {ConvictionStaking} from "../../src/contracts/governance/ConvictionStaking.sol";
import {ZeroAmount} from "../../src/contracts/errors/CommonErrors.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}

contract ConvictionStakingTest is Test {
    ConvictionStaking public staking;
    MockERC20 public token;

    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    function setUp() public {
        token = new MockERC20();
        staking = new ConvictionStaking(address(token));

      
        bool s1 = token.transfer(user1, 100_000 * 10 ** 18);
        assertTrue(s1, "Transfer to user1 failed");

        bool s2 = token.transfer(user2, 100_000 * 10 ** 18);
        assertTrue(s2, "Transfer to user2 failed");

        vm.startPrank(user1);
        token.approve(address(staking), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(staking), type(uint256).max);
        vm.stopPrank();
    }

    function test_Stake_Success() public {
        uint256 amount = 1000 * 10 ** 18;
        uint256 duration = 30;

        vm.prank(user1);
        staking.stake(amount, duration);

        (uint256 sAmount, uint256 sTime, uint256 sLock) = staking.userStakes(
            user1
        );

        assertEq(sAmount, amount);
        assertEq(sTime, block.timestamp);
        assertEq(sLock, block.timestamp + (duration * 1 days));
        assertEq(staking.totalStaked(), amount);
    }

    function test_Withdraw_Success() public {
        uint256 amount = 500 * 10 ** 18;
        uint256 duration = 10;

        vm.prank(user1);
        staking.stake(amount, duration);

        vm.warp(block.timestamp + (duration * 1 days) + 1);

        uint256 balanceBefore = token.balanceOf(user1);

        vm.prank(user1);
        staking.withdraw();

        assertEq(token.balanceOf(user1), balanceBefore + amount);
        assertEq(staking.totalStaked(), 0);
    }

    function test_RevertIf_StakeZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(ZeroAmount.selector);
        staking.stake(0, 10);
    }

    function test_RevertIf_WithdrawEarly() public {
        uint256 amount = 500 * 10 ** 18;
        uint256 duration = 10;

        vm.prank(user1);
        staking.stake(amount, duration);

        vm.prank(user1);

        vm.expectRevert(
            abi.encodeWithSelector(
                ConvictionStaking.StillLocked.selector,
                block.timestamp + (duration * 1 days)
            )
        );
        staking.withdraw();
    }

    function test_RevertIf_WithdrawNoActiveStake() public {
        vm.prank(user1);
        vm.expectRevert(ConvictionStaking.NoActiveStake.selector);
        staking.withdraw();
    }

    function test_GetStakedBalance() public {
        uint256 amount = 123 * 10 ** 18;
        vm.prank(user1);
        staking.stake(amount, 10);

        assertEq(staking.getStakedBalance(user1), amount);
    }

    function test_AccumulateStake() public {
        uint256 amount1 = 100 * 10 ** 18;
        uint256 amount2 = 200 * 10 ** 18;

        vm.startPrank(user1);
        staking.stake(amount1, 10);

        vm.warp(block.timestamp + 5 days);

        staking.stake(amount2, 10);
        vm.stopPrank();

        (uint256 sAmount, , uint256 sLock) = staking.userStakes(user1);

        assertEq(sAmount, amount1 + amount2);
        assertEq(sLock, block.timestamp + 10 days);
    }
}
