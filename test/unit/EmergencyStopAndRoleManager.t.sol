// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {EmergencyPause} from "../../src/contracts/security/EmergencyPause.sol";

import {
    OnlyAdmin,
    ZeroAddress,
    RoleNotGranted
} from "../../src/contracts/errors/SecurityErrors.sol";

import {
    OnlyGuardian,
    AlreadyPaused,
    NotPaused
} from "../../src/contracts/errors/SecurityErrors.sol";

contract EmergencyStopAndRoleManagerTest is Test {
    RoleManager roleManager;
    EmergencyPause emergency;

    address admin = address(0xA1);
    address guardian = address(0xB2);
    address attacker = address(0xC3);

    bytes32 constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    function setUp() public {
        vm.prank(admin);
        roleManager = new RoleManager(admin);

        emergency = new EmergencyPause(address(roleManager));
    }

    /*//////////////////////////////////////////////////////////////
                            ROLE MANAGER
    //////////////////////////////////////////////////////////////*/

    function test_admin_set_correctly() public view {
        assertEq(roleManager.admin(), admin);
    }

    function test_constructor_zero_admin_reverts() public {
        vm.expectRevert(ZeroAddress.selector);
        new RoleManager(address(0));
    }

    function test_grant_role_by_admin() public {
        vm.prank(admin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);

        assertTrue(roleManager.hasRole(GUARDIAN_ROLE, guardian));
    }

    function test_grant_role_non_admin_reverts() public {
        vm.prank(attacker);
        vm.expectRevert(OnlyAdmin.selector);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);
    }

    function test_revoke_role() public {
        vm.prank(admin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);

        vm.prank(admin);
        roleManager.revokeRole(GUARDIAN_ROLE, guardian);

        assertFalse(roleManager.hasRole(GUARDIAN_ROLE, guardian));
    }

    function test_revoke_missing_role_reverts() public {
        vm.prank(admin);
        vm.expectRevert(RoleNotGranted.selector);
        roleManager.revokeRole(GUARDIAN_ROLE, guardian);
    }

    function test_transfer_admin() public {
        address newAdmin = address(0xDD);

        vm.prank(admin);
        roleManager.transferAdmin(newAdmin);

        assertEq(roleManager.admin(), newAdmin);
    }

    function test_transfer_admin_zero_reverts() public {
        vm.prank(admin);
        vm.expectRevert(ZeroAddress.selector);
        roleManager.transferAdmin(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY PAUSE
    //////////////////////////////////////////////////////////////*/

    function test_guardian_can_pause() public {
        vm.prank(admin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);

        vm.prank(guardian);
        emergency.pause();

        assertTrue(emergency.paused());
    }

    function test_non_guardian_cannot_pause() public {
        vm.prank(attacker);
        vm.expectRevert(OnlyGuardian.selector);
        emergency.pause();
    }

    function test_pause_twice_reverts() public {
        vm.prank(admin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);

        vm.prank(guardian);
        emergency.pause();

        vm.prank(guardian);
        vm.expectRevert(AlreadyPaused.selector);
        emergency.pause();
    }

    function test_guardian_can_unpause() public {
        vm.prank(admin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);

        vm.prank(guardian);
        emergency.pause();

        vm.prank(guardian);
        emergency.unpause();

        assertFalse(emergency.paused());
    }

    function test_unpause_when_not_paused_reverts() public {
        vm.prank(admin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);

        vm.prank(guardian);
        vm.expectRevert(NotPaused.selector);
        emergency.unpause();
    }

    function test_non_guardian_cannot_unpause() public {
        vm.prank(attacker);
        vm.expectRevert(OnlyGuardian.selector);
        emergency.unpause();
    }
}
