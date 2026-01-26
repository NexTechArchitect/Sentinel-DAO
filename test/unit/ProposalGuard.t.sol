// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {ProposalGuard} from "../../src/contracts/governance/ProposalGuard.sol";

contract ProposalGuardTest is Test {
    ProposalGuard public guard;
    address public governor = makeAddr("governor");
    address public user = makeAddr("user");

    function setUp() public {
        guard = new ProposalGuard(governor);
    }

    function test_InitialState() public view {
        assertEq(guard.governor(), governor); 
    }

    function test_Validate_Success() public view {
        string memory desc = "This is a valid proposal description";
        bool valid = guard.validate(user, desc);
        assertTrue(valid);
    }

    function test_Validate_Fail_TooShort() public view {
        string memory shortDesc = "Hi";
        bool valid = guard.validate(user, shortDesc);
        assertFalse(valid);
    }

    function test_Validate_Fail_Spam() public view {
        string memory spam = "aaaaaaaaaaaa";
        bool valid = guard.validate(user, spam);
        assertFalse(valid);
    }

    function test_RecordProposal_OnlyGovernor() public {
        vm.prank(governor);
        guard.recordProposal(user);
        assertEq(guard.userProposalCount(user), 1);
    }

    function test_RevertIf_RecordProposal_NotGovernor() public {
        vm.startPrank(user);
        
        vm.expectRevert(ProposalGuard.Unauthorized.selector);
        guard.recordProposal(user);
        
        vm.stopPrank();
    }

    function test_UpdateReputation_OnlyGovernor() public {
        vm.prank(governor);
        guard.updateReputation(user, true); 
        
        assertEq(guard.externalReputation(user), 10);
        
        vm.prank(governor);
        guard.updateReputation(user, false); 
        
        assertEq(guard.externalReputation(user), 5);
    }
}