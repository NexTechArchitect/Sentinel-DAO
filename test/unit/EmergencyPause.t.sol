// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {EmergencyPause} from "../../src/contracts/security/EmergencyPause.sol";
import {IRoleManager} from "../../src/contracts/interfaces/IRoleManager.sol";

import {OnlyGuardian, AlreadyPaused} from "../../src/contracts/errors/SecurityErrors.sol";


contract MockRoleManager is IRoleManager {
    bytes32 public constant override GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    mapping(bytes32 => mapping(address => bool)) public roles;

    function hasRole(bytes32 role, address account) external view override returns (bool) {
        return roles[role][account];
    }

   
    function grantRole(bytes32 role, address account) external {
        roles[role][account] = true;
    }
}

contract EmergencyPauseTest is Test {
    EmergencyPause public pauseContract;
    MockRoleManager public roleManager;

    address public guardian = makeAddr("guardian");
    address public hacker = makeAddr("hacker");

    event Paused(address indexed guardian, uint256 timestamp);
    event Unpaused(address indexed guardian, uint256 timestamp);

    function setUp() public {
        roleManager = new MockRoleManager();
        pauseContract = new EmergencyPause(address(roleManager));

       
        roleManager.grantRole(roleManager.GUARDIAN_ROLE(), guardian);
    }

 
    function test_InitialState() public view {
        assertFalse(pauseContract.isPaused());
        assertEq(pauseContract.MAX_PAUSE_DURATION(), 7 days);
    }

    function test_Pause_Success() public {
        vm.prank(guardian);
        
        vm.expectEmit(true, false, false, true);
        emit Paused(guardian, block.timestamp);
        
        pauseContract.pause();
        
        assertTrue(pauseContract.isPaused());
        assertEq(pauseContract.lastPauseTime(), block.timestamp);
    }

    function test_RevertIf_NotGuardian() public {
        vm.prank(hacker);
        vm.expectRevert(OnlyGuardian.selector);
        pauseContract.pause();
    }

   
    function test_RevertIf_AlreadyPaused() public {
        vm.prank(guardian);
        pauseContract.pause();

        vm.prank(guardian);
        vm.expectRevert(AlreadyPaused.selector);
        pauseContract.pause();
    }

    function test_Unpause_Success() public {
        vm.prank(guardian);
        pauseContract.pause();

        vm.prank(guardian);
        vm.expectEmit(true, false, false, true);
        emit Unpaused(guardian, block.timestamp);
        
        pauseContract.unpause();
        assertFalse(pauseContract.isPaused());
    }

   
    function test_AutoUnpause_After7Days() public {
   
        vm.warp(1000);
        vm.prank(guardian);
        pauseContract.pause();
        assertTrue(pauseContract.isPaused());

      
        vm.warp(1000 + 6 days);
        assertTrue(pauseContract.isPaused());

      
        vm.warp(1000 + 7 days + 1);
        assertFalse(pauseContract.isPaused());

       
        vm.prank(guardian);
        pauseContract.pause();
        assertTrue(pauseContract.isPaused());
    }

    
    function test_ManualUnpause_AfterExpiry() public {
        vm.warp(1000);
        vm.prank(guardian);
        pauseContract.pause();

        vm.warp(1000 + 8 days);
        
      
        vm.prank(guardian);
        pauseContract.unpause();
        
        assertFalse(pauseContract.isPaused());
    }
}