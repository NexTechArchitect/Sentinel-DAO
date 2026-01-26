// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {
    GovernanceToken
} from "../../src/contracts/governance/GovernanceToken.sol";
import {ZeroAddress} from "../../src/contracts/errors/CommonErrors.sol";
import {
    NotGovernance,
    MaxSupplyExceeded
} from "../../src/contracts/errors/GovernanceErrors.sol";

contract GovernanceTokenTest is Test {
    GovernanceToken public token;
    address public executor = makeAddr("executor");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public hacker = makeAddr("hacker");

    function setUp() public {
        vm.prank(executor);
        token = new GovernanceToken(user1, executor);
    }

    function test_InitialState() public view {
        assertEq(token.name(), "Diso Coin");
        assertEq(token.symbol(), "DISO");
        assertEq(token.GOVERNANCE_EXECUTOR(), executor);
        assertEq(token.totalSupply(), 150_000_000 * 10 ** 18);
        assertEq(token.balanceOf(user1), 150_000_000 * 10 ** 18);
    }

    function test_Minting_Success() public {
        uint256 amount = 1000 * 10 ** 18;

        vm.prank(executor);
        token.mint(user2, amount);

        assertEq(token.balanceOf(user2), amount);
    }

    function test_RevertIf_UnauthorizedMint() public {
        vm.prank(hacker);
        vm.expectRevert(NotGovernance.selector);
        token.mint(hacker, 1000);
    }

    function test_RevertIf_MaxSupplyExceeded() public {
        uint256 currentSupply = token.totalSupply();
        uint256 maxSupply = token.MAX_SUPPLY();
        uint256 availableToMint = maxSupply - currentSupply;

        vm.startPrank(executor);

        token.mint(user2, availableToMint);
        assertEq(token.totalSupply(), maxSupply);

        vm.expectRevert(MaxSupplyExceeded.selector);
        token.mint(user2, 1);

        vm.stopPrank();
    }

    function test_Burn_Success() public {
        uint256 burnAmount = 50_000 * 10 ** 18;

        vm.prank(user1);
        token.burn(burnAmount);

        assertEq(token.totalSupply(), (150_000_000 * 10 ** 18) - burnAmount);
    }

    function test_VotingPower_UpdatesOnTransfer() public {
        vm.prank(user1);
        token.delegate(user1);

        uint256 initialPower = token.getVotes(user1);
        uint256 transferAmount = 10_000 * 10 ** 18;

        vm.prank(user1);
        bool success = token.transfer(user2, transferAmount);
        assertTrue(success, "Transfer failed");

        assertEq(token.getVotes(user1), initialPower - transferAmount);

        vm.prank(user2);
        token.delegate(user2);
        assertEq(token.getVotes(user2), transferAmount);
    }

    function test_SetGovernor_Success() public {
        address newGovernor = makeAddr("newGovernor");

        vm.prank(executor);
        token.setGovernor(newGovernor);

        assertEq(token.governor(), newGovernor);
    }

    function test_RevertIf_SetGovernor_Unauthorized() public {
        vm.prank(hacker);
        vm.expectRevert(NotGovernance.selector);
        token.setGovernor(makeAddr("gov"));
    }

    function test_RevertIf_SetGovernor_ZeroAddress() public {
        vm.prank(executor);
        vm.expectRevert(ZeroAddress.selector);
        token.setGovernor(address(0));
    }
}
