// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {ZeroAddress, ArrayLengthMismatch} from "../../src/contracts/errors/CommonErrors.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract RoleManagerTest is Test {
    RoleManager public roleManager;
    
    address public rootAdmin = makeAddr("rootAdmin");
    address public guardian = makeAddr("guardian");
    address public executor = makeAddr("executor");
    address public hacker = makeAddr("hacker");

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    function setUp() public {
        vm.prank(rootAdmin);
        roleManager = new RoleManager(rootAdmin);
    }

    
    function test_InitialSetup() public view {
        assertTrue(roleManager.hasRole(DEFAULT_ADMIN_ROLE, rootAdmin));
        assertTrue(roleManager.hasRole(ADMIN_ROLE, rootAdmin));
        
     
        assertEq(roleManager.getRoleAdmin(GUARDIAN_ROLE), ADMIN_ROLE);
        assertEq(roleManager.getRoleAdmin(EXECUTOR_ROLE), ADMIN_ROLE);
    }

  
    function test_RevertIf_RootAdminZero() public {
        vm.expectRevert(ZeroAddress.selector);
        new RoleManager(address(0));
    }

    function test_GrantRoleBatch_Success() public {
        bytes32[] memory roles = new bytes32[](2);
        roles[0] = GUARDIAN_ROLE;
        roles[1] = EXECUTOR_ROLE;

        address[] memory accounts = new address[](2);
        accounts[0] = guardian;
        accounts[1] = executor;

        vm.prank(rootAdmin);
        roleManager.grantRoleBatch(roles, accounts);

        assertTrue(roleManager.isGuardian(guardian));
        assertTrue(roleManager.isExecutor(executor));
    }

    
    function test_RevokeRoleBatch_Success() public {
        
        test_GrantRoleBatch_Success();

        bytes32[] memory roles = new bytes32[](2);
        roles[0] = GUARDIAN_ROLE;
        roles[1] = EXECUTOR_ROLE;

        address[] memory accounts = new address[](2);
        accounts[0] = guardian;
        accounts[1] = executor;

        vm.prank(rootAdmin);
        roleManager.revokeRoleBatch(roles, accounts);

        assertFalse(roleManager.isGuardian(guardian));
        assertFalse(roleManager.isExecutor(executor));
    }

   
    function test_Batch_Reverts() public {
        bytes32[] memory roles = new bytes32[](1);
        address[] memory accounts = new address[](2); 
        vm.startPrank(rootAdmin);
        
        vm.expectRevert(ArrayLengthMismatch.selector);
        roleManager.grantRoleBatch(roles, accounts);

        
        roles = new bytes32[](1);
        roles[0] = GUARDIAN_ROLE;
        accounts = new address[](1);
        accounts[0] = address(0); 

        vm.expectRevert(ZeroAddress.selector);
        roleManager.grantRoleBatch(roles, accounts);
        
        vm.stopPrank();
    }
    function test_RevertIf_HackerGrantsRole() public {
        bytes32[] memory roles = new bytes32[](1);
        roles[0] = ADMIN_ROLE;
        address[] memory accounts = new address[](1);
        accounts[0] = hacker;

        vm.prank(hacker);
      
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                hacker,
                ADMIN_ROLE
            )
        );
        roleManager.grantRoleBatch(roles, accounts);
    }

    function test_ViewHelpers() public {
        vm.startPrank(rootAdmin);
        roleManager.grantRole(GUARDIAN_ROLE, guardian);
        roleManager.grantRole(EXECUTOR_ROLE, executor);
        vm.stopPrank();

        assertTrue(roleManager.isGuardian(guardian));
        assertTrue(roleManager.isExecutor(executor));
        assertTrue(roleManager.isAdmin(rootAdmin));
        
        assertFalse(roleManager.isGuardian(hacker));
    }
}