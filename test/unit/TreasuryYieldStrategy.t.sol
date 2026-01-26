// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {TreasuryYieldStrategy} from "../../src/contracts/core/TreasuryYieldStrategy.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Unauthorized} from "../../src/contracts/errors/CommonErrors.sol";

contract MockPool {
    bool public shouldFail;

    function setFail(bool _fail) external {
        shouldFail = _fail;
    }

    function supply(address asset, uint256 amount, address, uint16) external {
        if (shouldFail) revert("Aave: Supply Failed");
        bool success = ERC20(asset).transferFrom(msg.sender, address(this), amount);
        require(success, "Mock supply failed");
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        if (shouldFail) revert("Aave: Withdraw Failed");
        bool success = ERC20(asset).transfer(to, amount);
        require(success, "Mock withdraw failed");
        return amount;
    }
}

contract MockUSDC is ERC20 {
    constructor() ERC20("USDC", "USDC") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}

contract TreasuryYieldStrategyTest is Test {
    TreasuryYieldStrategy public strategy;
    RoleManager public roleManager;
    MockPool public aavePool;
    MockUSDC public usdc;

    address public admin = makeAddr("admin");
    address public treasury = makeAddr("treasury");
    address public hacker = makeAddr("hacker");

    function setUp() public {
        vm.startPrank(admin);
        roleManager = new RoleManager(admin);
        aavePool = new MockPool();
        usdc = new MockUSDC();

        strategy = new TreasuryYieldStrategy(address(aavePool), address(roleManager), treasury);

        bool success = usdc.transfer(treasury, 100_000 * 10 ** 18);
        assertTrue(success);
        vm.stopPrank();
    }

    function test_DepositToAave_Success() public {
        uint256 amount = 1000 * 10 ** 18;
        vm.startPrank(treasury);
        usdc.approve(address(strategy), amount);
        
        bool success = usdc.transfer(address(strategy), amount);
        assertTrue(success);

        strategy.depositToAave(address(usdc), amount);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(strategy)), 0);
        assertEq(usdc.balanceOf(address(aavePool)), amount);
    }

    function test_RevertIf_AaveSupplyFails() public {
        uint256 amount = 1000 * 10 ** 18;
        vm.prank(treasury);
        
        bool success = usdc.transfer(address(strategy), amount);
        assertTrue(success);

        aavePool.setFail(true);
        vm.startPrank(treasury);
        vm.expectRevert(TreasuryYieldStrategy.DepositFailed.selector);
        strategy.depositToAave(address(usdc), amount);
        vm.stopPrank();
    }

    function test_WithdrawFromAave_Success() public {
        uint256 amount = 500 * 10 ** 18;
        vm.prank(admin);
        
        bool success = usdc.transfer(address(aavePool), amount);
        assertTrue(success);

        vm.startPrank(treasury);
        strategy.withdrawFromAave(address(usdc), amount, treasury);
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), 100_000 * 10 ** 18 + amount);
    }

    function test_RevertIf_AaveWithdrawFails() public {
        uint256 amount = 500 * 10 ** 18;
        aavePool.setFail(true);
        vm.prank(treasury);
        vm.expectRevert(TreasuryYieldStrategy.WithdrawFailed.selector);
        strategy.withdrawFromAave(address(usdc), amount, treasury);
    }

    function test_RevertIf_CallerNotTreasury() public {
        vm.prank(hacker);
        vm.expectRevert(Unauthorized.selector);
        strategy.depositToAave(address(usdc), 100);
    }

    function test_EmergencyWithdraw_AdminOnly() public {
        uint256 amount = 100 * 10 ** 18;
        vm.prank(admin);
        
        bool success = usdc.transfer(address(strategy), amount);
        assertTrue(success);

        vm.prank(hacker);
        vm.expectRevert(Unauthorized.selector);
        strategy.emergencyWithdraw(address(usdc));

        vm.prank(admin);
        strategy.emergencyWithdraw(address(usdc));

        assertEq(usdc.balanceOf(treasury), 100_000 * 10 ** 18 + amount);
    }
}