// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";

/**
 * @title DAOCore Fuzz Test Suite
 * @notice Validates the core administrative logic of the DAO.
 * @dev Focuses on Access Control (Timelock-only functions) and State Integrity.
 */
contract DAOCoreFuzzTest is Test {
    /* -------------------------------------------------------------------------- */
    /* STATE VARIABLES                                                            */
    /* -------------------------------------------------------------------------- */

    DAOCore core;

    // Fixed addresses for role simulation
    address internal constant TIMELOCK = address(100);
    address internal constant GOVERNOR = address(200);
    address internal constant TREASURY = address(300);

    /* -------------------------------------------------------------------------- */
    /* SETUP                                                                      */
    /* -------------------------------------------------------------------------- */

    function setUp() public {
        // Deploy Core with initial roles
        core = new DAOCore(GOVERNOR, TIMELOCK, TREASURY);
    }

    /* -------------------------------------------------------------------------- */
    /* FUZZ: CRITICAL ADDRESS UPDATES                                             */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Ensures Timelock can update the Governor address.
     */
    function testFuzz_UpdateGovernor_Success(address newGovernor) public {
        // Constraints: Valid address and distinct from current
        vm.assume(newGovernor != address(0));
        vm.assume(newGovernor != core.governor());

        vm.prank(TIMELOCK);
        core.updateGovernor(newGovernor);

        assertEq(core.governor(), newGovernor, "Governor address mismatch");
    }

    /**
     * @notice Ensures random callers cannot hijack the Governor role.
     */
    function testFuzz_RevertIf_UnauthorizedUpdateGovernor(
        address attacker,
        address newGovernor
    ) public {
        vm.assume(attacker != TIMELOCK);
        vm.assume(newGovernor != address(0));

        vm.prank(attacker);
        vm.expectRevert(); // Expect AccessControl/Ownable revert
        core.updateGovernor(newGovernor);
    }

    /**
     * @notice Ensures Timelock can update itself (Rotational Key Security).
     */
    function testFuzz_UpdateTimelock_Success(address newTimelock) public {
        vm.assume(newTimelock != address(0));
        vm.assume(newTimelock != core.timelock());

        vm.prank(TIMELOCK);
        core.updateTimelock(newTimelock);

        assertEq(core.timelock(), newTimelock, "Timelock address mismatch");
    }

    /**
     * @notice Ensures random callers cannot change the Timelock.
     */
    function testFuzz_RevertIf_UnauthorizedUpdateTimelock(
        address attacker,
        address newTimelock
    ) public {
        vm.assume(attacker != TIMELOCK);
        vm.assume(newTimelock != address(0));

        vm.prank(attacker);
        vm.expectRevert();
        core.updateTimelock(newTimelock);
    }

    /**
     * @notice Ensures Timelock can update the Treasury address.
     */
    function testFuzz_UpdateTreasury_Success(address newTreasury) public {
        vm.assume(newTreasury != address(0));
        vm.assume(newTreasury != core.treasury());

        vm.prank(TIMELOCK);
        core.updateTreasury(newTreasury);

        assertEq(core.treasury(), newTreasury, "Treasury address mismatch");
    }

    /**
     * @notice Ensures random callers cannot redirect Treasury funds/control.
     */
    function testFuzz_RevertIf_UnauthorizedUpdateTreasury(
        address attacker,
        address newTreasury
    ) public {
        vm.assume(attacker != TIMELOCK);
        vm.assume(newTreasury != address(0));

        vm.prank(attacker);
        vm.expectRevert();
        core.updateTreasury(newTreasury);
    }

    /* -------------------------------------------------------------------------- */
    /* FUZZ: MODULE SYSTEM LIFECYCLE                                              */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Validates the full lifecycle: Register -> Verify -> Remove -> Verify.
     */
    function testFuzz_ModuleLifecycle_Success(
        bytes32 moduleId,
        address moduleAddress
    ) public {
        vm.assume(moduleId != bytes32(0));
        vm.assume(moduleAddress != address(0));

        // 1. Register Module
        vm.prank(TIMELOCK);
        core.registerModule(moduleId, moduleAddress);

        assertEq(
            core.getModule(moduleId),
            moduleAddress,
            "Module registration failed"
        );

        // 2. Remove Module
        vm.prank(TIMELOCK);
        core.removeModule(moduleId);

        assertEq(core.getModule(moduleId), address(0), "Module removal failed");
    }

    /**
     * @notice Ensures unauthorized users cannot add malicious modules.
     */
    function testFuzz_RevertIf_UnauthorizedRegisterModule(
        address attacker,
        bytes32 moduleId,
        address moduleAddress
    ) public {
        vm.assume(attacker != TIMELOCK);

        vm.prank(attacker);
        vm.expectRevert();
        core.registerModule(moduleId, moduleAddress);
    }

    /**
     * @notice Ensures unauthorized users cannot disable active modules.
     */
    function testFuzz_RevertIf_UnauthorizedRemoveModule(
        address attacker,
        bytes32 moduleId
    ) public {
        vm.assume(attacker != TIMELOCK);

        vm.prank(attacker);
        vm.expectRevert();
        core.removeModule(moduleId);
    }
}
