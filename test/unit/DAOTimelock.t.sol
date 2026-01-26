// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";

contract DAOTimelockTest is Test {
    DAOTimelock public timelock;
    address public admin = makeAddr("admin");
    address public proposer = makeAddr("proposer");
    address public executor = makeAddr("executor");

    function setUp() public {
        vm.startPrank(admin);
        
        address[] memory proposers = new address[](1);
        proposers[0] = proposer;
        
        address[] memory executors = new address[](1);
        executors[0] = executor;

        
        timelock = new DAOTimelock(2 days, proposers, executors, address(0));
        
        vm.stopPrank();
    }

    function test_InitialRoles() public view {
        assertTrue(timelock.hasRole(timelock.PROPOSER_ROLE(), proposer));
        assertTrue(timelock.hasRole(timelock.EXECUTOR_ROLE(), executor));
        
        
        assertTrue(timelock.hasRole(timelock.DEFAULT_ADMIN_ROLE(), address(timelock)));
    }

    function test_UpdateDelay_Success() public {
        vm.prank(address(timelock));
        timelock.updateDelay(3 days);
        assertEq(timelock.getMinDelay(), 3 days);
    }

    function test_RevertIf_UpdateDelay_DirectCall() public {
        vm.prank(admin);
        vm.expectRevert(); 
        timelock.updateDelay(5 days);
    }

    function test_RevertIf_Schedule_Unauthorized() public {
        vm.prank(admin);
        vm.expectRevert(); 
        timelock.schedule(address(0), 0, "", bytes32(0), bytes32(0), 2 days);
    }

    function test_RevertIf_Execute_BeforeDelay() public {
        vm.prank(executor);
        vm.expectRevert(); 
        timelock.execute(address(0), 0, "", bytes32(0), bytes32(0));
    }
}