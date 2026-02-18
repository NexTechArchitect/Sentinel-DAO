// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {Unauthorized} from "../../src/contracts/errors/CommonErrors.sol";

contract DAOCoreTest is Test {
    DAOCore public core;
    RoleManager public roleManager;
    GovernanceToken public token;

    address public admin = makeAddr("admin");
    address public governor = makeAddr("governor");
    address public treasury = makeAddr("treasury");
    address public timelock = makeAddr("timelock");
    address public hacker = makeAddr("hacker");

    event SystemLinked(address governor, address treasury, address timelock);
    event SetupLocked(address indexed admin, uint256 timestamp);
    event ModuleLinked(bytes32 indexed moduleKey, address indexed moduleAddress);

    function setUp() public {
        vm.startPrank(admin);
        
        roleManager = new RoleManager(admin);
        token = new GovernanceToken(admin, admin); 
        core = new DAOCore(address(roleManager), address(token));
        
        vm.stopPrank();
    }

    function test_InitialState() public view {
        assertEq(address(core.ROLE_MANAGER()), address(roleManager));
        assertEq(address(core.TOKEN()), address(token));
    }

    function test_LinkCoreModules_Success() public {
        vm.prank(admin);
        
        vm.expectEmit(false, false, false, true);
        emit SystemLinked(governor, treasury, timelock);
        
        core.linkCoreModules(governor, treasury, timelock);

        assertEq(core.governor(), governor);
        assertEq(core.treasury(), treasury);
        assertEq(core.timelock(), timelock);
    }

    function test_RevertIf_HackerLinksModules() public {
        vm.prank(hacker);
        vm.expectRevert(Unauthorized.selector);
        core.linkCoreModules(governor, treasury, timelock);
    }

    function test_LockSetup_Success() public {
        vm.startPrank(admin);
        
        core.linkCoreModules(governor, treasury, timelock);
        
        vm.expectEmit(true, false, false, true);
        emit SetupLocked(admin, block.timestamp);
        
        core.lockSetup();

        vm.expectRevert(DAOCore.AlreadyLocked.selector); 
        core.linkCoreModules(makeAddr("newGov"), treasury, timelock);
        
        vm.stopPrank();
    }

    function test_RevertIf_HackerLocksSetup() public {
        vm.prank(hacker);
        vm.expectRevert(Unauthorized.selector);
        core.lockSetup();
    }

    function test_RegisterModule_Success() public {
        bytes32 moduleKey = keccak256("TEST_MODULE");
        address moduleAddr = makeAddr("module");

        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit ModuleLinked(moduleKey, moduleAddr);
        
        core.registerModule(moduleKey, moduleAddr);

        assertEq(core.getModule(moduleKey), moduleAddr);
    }

    function test_RevertIf_ModuleAlreadyExists() public {
        bytes32 moduleKey = keccak256("TEST_MODULE");
        address moduleAddr = makeAddr("module");

        vm.startPrank(admin);
        core.registerModule(moduleKey, moduleAddr);

        vm.expectRevert(DAOCore.ModuleAlreadyExists.selector);
        core.registerModule(moduleKey, makeAddr("otherModule"));
        vm.stopPrank();
    }
}
