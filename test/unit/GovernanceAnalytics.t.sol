// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {GovernanceAnalytics} from "../../src/contracts/security/GovernanceAnalytics.sol";

contract GovernanceAnalyticsTest is Test {
    GovernanceAnalytics public analytics;
    
    address public governor = makeAddr("governor");
    address public token = makeAddr("token");
    address public hacker = makeAddr("hacker");

    function setUp() public {
        analytics = new GovernanceAnalytics(governor, token);
    }

    function test_InitialState() public view {
        assertEq(analytics.GOVERNOR(), governor);
        assertEq(analytics.TOKEN(), token);
        
        assertEq(analytics.totalProposals(), 0);
        assertEq(analytics.successfulProposals(), 0);
        assertEq(analytics.failedProposals(), 0);
    }

    function test_UpdateAnalytics_Success() public {
        vm.prank(governor);
        analytics.updateAnalytics(1, true);

        assertEq(analytics.totalProposals(), 1);
        assertEq(analytics.successfulProposals(), 1);
        assertEq(analytics.failedProposals(), 0);
    }

    function test_UpdateAnalytics_Failure() public {
        vm.prank(governor);
        analytics.updateAnalytics(2, false);

        assertEq(analytics.totalProposals(), 1);
        assertEq(analytics.successfulProposals(), 0);
        assertEq(analytics.failedProposals(), 1);
    }

    function test_RevertIf_NotGovernor() public {
        vm.prank(hacker);
        vm.expectRevert(GovernanceAnalytics.Unauthorized.selector);
        analytics.updateAnalytics(1, true);
    }
    
    function test_GetStats() public {
        vm.startPrank(governor);
        analytics.updateAnalytics(1, true); 
        analytics.updateAnalytics(2, false); 
        vm.stopPrank();

        (uint256 total, uint256 success, uint256 failed) = analytics.getStats();
        
        assertEq(total, 2);
        assertEq(success, 1);
        assertEq(failed, 1);
    }
}