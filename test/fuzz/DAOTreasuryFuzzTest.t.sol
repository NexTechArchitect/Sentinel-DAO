// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {MockERC20} from "../mocks/MocksERC20.sol";

/**
 * @title DAO Treasury Fuzz Suite
 * @notice Stateless fuzzing for Treasury asset management.
 * @dev Tests ETH/ERC20 transfers, access control, and solvency limits.
 */
contract DAOTreasuryFuzzTest is Test {
    /* -------------------------------------------------------------------------- */
    /* STATE VARIABLES                                                            */
    /* -------------------------------------------------------------------------- */

    DAOTreasury treasury;
    MockERC20 token;

    address internal constant TIMELOCK = address(100);

    // FIX: Re-added the USER constant here
    address internal constant USER = address(200);

    // Initial Funding Constants
    uint256 internal constant INITIAL_ETH_BALANCE = 100 ether;
    uint256 internal constant INITIAL_TOKEN_BALANCE = 10_000_000 ether;

    /* -------------------------------------------------------------------------- */
    /* SETUP                                                                      */
    /* -------------------------------------------------------------------------- */

    function setUp() public {
        treasury = new DAOTreasury(TIMELOCK);
        token = new MockERC20("Mock", "MOCK");

        // Fund Treasury with Tokens
        token.mint(address(treasury), INITIAL_TOKEN_BALANCE);

        // Fund Treasury with ETH
        vm.deal(address(treasury), INITIAL_ETH_BALANCE);
    }

    /* -------------------------------------------------------------------------- */
    /* FUZZ TESTS: ETH MANAGEMENT                                                 */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Verifies Timelock can withdraw any valid amount of ETH.
     * @dev Fuzzes 'amount' between 1 and the treasury's full balance.
     */
    function testFuzz_WithdrawETH_Success(
        address receiver,
        uint256 amount
    ) public {
        // 1. Constraints
        vm.assume(receiver != address(0));
        vm.assume(receiver != address(treasury));

        // Exclude Precompiles (addresses 0x01 to 0xff usually)
        vm.assume(uint160(receiver) > 0x1000);

        // Ensure Receiver is an EOA (Externally Owned Account/Wallet)
        // Contracts might revert when receiving ETH, which isn't a bug in Treasury.
        vm.assume(receiver.code.length == 0);

        // Bound amount from 1 (not 0) because contract reverts on 0
        amount = bound(amount, 1, address(treasury).balance);

        uint256 treasuryBefore = address(treasury).balance;
        uint256 receiverBefore = receiver.balance;

        // 2. Action
        vm.prank(TIMELOCK);
        treasury.transferETH(payable(receiver), amount);

        // 3. Assertions
        assertEq(
            address(treasury).balance,
            treasuryBefore - amount,
            "Treasury balance mismatch"
        );
        assertEq(
            receiver.balance,
            receiverBefore + amount,
            "Receiver balance mismatch"
        );
    }

    /**
     * @notice Security Check: Ensures random users CANNOT withdraw ETH.
     * @dev Fuzzes random 'attacker' addresses.
     */
    function testFuzz_RevertIf_UnauthorizedETHWithdraw(
        address attacker,
        uint256 amount
    ) public {
        // 1. Constraints
        vm.assume(attacker != TIMELOCK);

        // We test any amount > 0.
        amount = bound(amount, 1, INITIAL_ETH_BALANCE);

        // 2. Expect Revert
        vm.prank(attacker);
        vm.expectRevert();
        treasury.transferETH(payable(attacker), amount);
    }

    /* -------------------------------------------------------------------------- */
    /* FUZZ TESTS: ERC20 MANAGEMENT                                               */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Verifies Timelock can withdraw any valid amount of ERC20 tokens.
     * @dev Fuzzes 'amount' between 1 and the treasury's full token balance.
     */
    function testFuzz_WithdrawERC20_Success(
        address receiver,
        uint256 amount
    ) public {
        // 1. Constraints
        vm.assume(receiver != address(0));

        // Bound amount from 1 (not 0) because contract reverts on 0
        amount = bound(amount, 1, token.balanceOf(address(treasury)));

        uint256 treasuryBefore = token.balanceOf(address(treasury));
        uint256 receiverBefore = token.balanceOf(receiver);

        // 2. Action
        vm.prank(TIMELOCK);
        treasury.transferERC20(address(token), receiver, amount);

        // 3. Assertions
        assertEq(
            token.balanceOf(address(treasury)),
            treasuryBefore - amount,
            "Treasury token deduction failed"
        );
        assertEq(
            token.balanceOf(receiver),
            receiverBefore + amount,
            "Receiver token credit failed"
        );
    }

    /**
     * @notice Security Check: Ensures random users CANNOT withdraw Tokens.
     */
    function testFuzz_RevertIf_UnauthorizedERC20Withdraw(
        address attacker,
        uint256 amount
    ) public {
        // 1. Constraints
        vm.assume(attacker != TIMELOCK);
        amount = bound(amount, 1, INITIAL_TOKEN_BALANCE);

        // 2. Expect Revert
        vm.prank(attacker);
        vm.expectRevert();
        treasury.transferERC20(address(token), attacker, amount);
    }

    /**
     * @notice Edge Case: Attempting to withdraw more tokens than exist in Treasury.
     * @dev Should revert with generic panic or specific error depending on token implementation.
     */
    function testFuzz_RevertIf_WithdrawMoreThanBalance(uint256 amount) public {
        // 1. Constraints: Amount is strictly greater than balance
        uint256 currentBalance = token.balanceOf(address(treasury));

        // If balance is max uint256, we can't test "more", so return
        if (currentBalance == type(uint256).max) return;

        // Bound amount from (balance + 1) to max
        amount = bound(amount, currentBalance + 1, type(uint256).max);

        // 2. Expect Revert (ERC20 Insufficient Balance)
        vm.prank(TIMELOCK);
        vm.expectRevert();
        treasury.transferERC20(address(token), USER, amount);
    }
}
