// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {VotingPowerSnapshot} from "../../src/contracts/offchain/VotingPowerSnapshot.sol";
import {ZeroAddress} from "../../src/contracts/errors/CommonErrors.sol";
import {Unauthorized} from "../../src/contracts/errors/GovernanceErrors.sol";

contract VotingPowerSnapshotTest is Test {
    VotingPowerSnapshot public snapshot;

    address public governor = makeAddr("governor");
    address public timelock = makeAddr("timelock");
    address public hacker = makeAddr("hacker");

    event SnapshotTaken(uint256 indexed proposalId, uint256 timestamp);

    function setUp() public {
        snapshot = new VotingPowerSnapshot(governor, timelock);
    }

    function test_InitialState() public view {
        assertEq(snapshot.GOVERNOR(), governor);
        assertEq(snapshot.TIMELOCK(), timelock);
    }

    function test_CreateSnapshot_ByGovernor() public {
        vm.prank(governor);
        
        vm.expectEmit(true, false, false, true);
        emit SnapshotTaken(1, block.timestamp);
        
        snapshot.createSnapshot(1);
    }

    function test_CreateSnapshot_ByTimelock() public {
        vm.prank(timelock);
        
        vm.expectEmit(true, false, false, true);
        emit SnapshotTaken(2, block.timestamp);
        
        snapshot.createSnapshot(2);
    }

    function test_RevertIf_Unauthorized() public {
        vm.prank(hacker);
        
        vm.expectRevert(Unauthorized.selector);
        snapshot.createSnapshot(1);
    }

    function test_RevertIf_ZeroAddress() public {
        
        vm.expectRevert(ZeroAddress.selector);
        new VotingPowerSnapshot(address(0), timelock);

        vm.expectRevert(ZeroAddress.selector);
        new VotingPowerSnapshot(governor, address(0));
    }
}