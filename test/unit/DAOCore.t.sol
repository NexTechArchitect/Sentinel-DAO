// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {DAOCore} from "../../src/contracts/core/DAOCore.sol";

import {
    OnlyTimelock,
    InvalidAddress,
    ModuleAlreadyExists,
    ModuleNotFound,
    SameAddress
} from "../../src/contracts/errors/GovernanceErrors.sol";

contract DAOCoreTest is Test {
    DAOCore core;

    address governor = address(0x1111);
    address timelock = address(0x2222);
    address treasury = address(0x3333);

    address newGovernor = address(0xAAAA);
    address newTimelock = address(0xBBBB);
    address newTreasury = address(0xCCCC);

    address attacker = address(0xDEAD);

    bytes32 constant MODULE_STAKING = keccak256("STAKING");
    bytes32 constant MODULE_AIRDROP = keccak256("AIRDROP");

    function setUp() public {
        core = new DAOCore(governor, timelock, treasury);
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    function test_constructor_sets_addresses() public view {
        assertEq(core.governor(), governor);
        assertEq(core.timelock(), timelock);
        assertEq(core.treasury(), treasury);
    }

    function test_constructor_reverts_zero_address() public {
        vm.expectRevert(InvalidAddress.selector);
        new DAOCore(address(0), timelock, treasury);

        vm.expectRevert(InvalidAddress.selector);
        new DAOCore(governor, address(0), treasury);

        vm.expectRevert(InvalidAddress.selector);
        new DAOCore(governor, timelock, address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL
    //////////////////////////////////////////////////////////////*/

    function test_only_timelock_can_update() public {
        vm.prank(attacker);
        vm.expectRevert(OnlyTimelock.selector);
        core.updateGovernor(newGovernor);
    }

    /*//////////////////////////////////////////////////////////////
                        GOVERNOR UPDATE
    //////////////////////////////////////////////////////////////*/

    function test_update_governor() public {
        vm.prank(timelock);
        core.updateGovernor(newGovernor);

        assertEq(core.governor(), newGovernor);
    }

    function test_update_governor_same_address_reverts() public {
        vm.prank(timelock);
        vm.expectRevert(SameAddress.selector);
        core.updateGovernor(governor);
    }

    function test_update_governor_zero_address_reverts() public {
        vm.prank(timelock);
        vm.expectRevert(InvalidAddress.selector);
        core.updateGovernor(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        TIMELOCK UPDATE
    //////////////////////////////////////////////////////////////*/

    function test_update_timelock() public {
        vm.prank(timelock);
        core.updateTimelock(newTimelock);

        assertEq(core.timelock(), newTimelock);
    }

    function test_update_timelock_same_reverts() public {
        vm.prank(timelock);
        vm.expectRevert(SameAddress.selector);
        core.updateTimelock(timelock);
    }

    /*//////////////////////////////////////////////////////////////
                        TREASURY UPDATE
    //////////////////////////////////////////////////////////////*/

    function test_update_treasury() public {
        vm.prank(timelock);
        core.updateTreasury(newTreasury);

        assertEq(core.treasury(), newTreasury);
    }

    function test_update_treasury_zero_reverts() public {
        vm.prank(timelock);
        vm.expectRevert(InvalidAddress.selector);
        core.updateTreasury(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                            MODULE SYSTEM
    //////////////////////////////////////////////////////////////*/

    function test_register_module() public {
        vm.prank(timelock);
        core.registerModule(MODULE_STAKING, address(0x9999));

        assertEq(core.getModule(MODULE_STAKING), address(0x9999));
    }

    function test_register_module_only_timelock() public {
        vm.prank(attacker);
        vm.expectRevert(OnlyTimelock.selector);
        core.registerModule(MODULE_STAKING, address(1));
    }

    function test_register_module_zero_address_reverts() public {
        vm.prank(timelock);
        vm.expectRevert(InvalidAddress.selector);
        core.registerModule(MODULE_STAKING, address(0));
    }

    function test_register_module_duplicate_reverts() public {
        vm.prank(timelock);
        core.registerModule(MODULE_STAKING, address(1));

        vm.prank(timelock);
        vm.expectRevert(ModuleAlreadyExists.selector);
        core.registerModule(MODULE_STAKING, address(2));
    }

    function test_remove_module() public {
        vm.prank(timelock);
        core.registerModule(MODULE_AIRDROP, address(123));

        vm.prank(timelock);
        core.removeModule(MODULE_AIRDROP);

        assertEq(core.getModule(MODULE_AIRDROP), address(0));
    }

    function test_remove_nonexistent_module_reverts() public {
        vm.prank(timelock);
        vm.expectRevert(ModuleNotFound.selector);
        core.removeModule(MODULE_AIRDROP);
    }
}
