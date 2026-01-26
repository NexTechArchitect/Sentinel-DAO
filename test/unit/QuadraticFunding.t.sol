// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {QuadraticFunding} from "../../src/contracts/governance/QuadraticFunding.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";

contract QuadraticFundingTest is Test {
    QuadraticFunding qf;
    GovernanceToken token;
    RoleManager roles;

    address admin = makeAddr("admin");
    address projectOwner1 = makeAddr("project1");
    address projectOwner2 = makeAddr("project2");
    address donor1 = makeAddr("donor1");
    address donor2 = makeAddr("donor2");

    function setUp() public {
        vm.startPrank(admin);
        
        roles = new RoleManager(admin);
        token = new GovernanceToken(admin, admin);
        qf = new QuadraticFunding(address(roles), address(token));
        
        roles.grantRole(roles.ADMIN_ROLE(), admin);

        token.mint(address(admin), 1_000_000e18);
        token.approve(address(qf), 1_000_000e18);
        
        qf.fundMatchingPool(10_000e18);

        vm.stopPrank();

        vm.prank(admin);
        token.mint(donor1, 1000e18);
        
        vm.prank(admin);
        token.mint(donor2, 1000e18);
    }

    function test_RegisterProject() public {
        vm.startPrank(admin);
        uint256 pid = qf.createProject(projectOwner1);
        vm.stopPrank();

        (address owner, , , , bool isActive, ) = qf.projects(pid);
        
        assertEq(owner, projectOwner1);
        assertTrue(isActive);
    }

    function test_DonateAndCalculateMatch() public {
        vm.startPrank(admin);
        uint256 pid1 = qf.createProject(projectOwner1);
        qf.createProject(projectOwner2);
        vm.stopPrank();

        vm.startPrank(donor1);
        token.approve(address(qf), 100e18);
        qf.contribute(pid1, 100e18); 
        vm.stopPrank();

        vm.prank(admin);
        qf.calculateMatching();

        (,,, uint256 matchedAmount,,) = qf.projects(pid1);
        
        assertEq(matchedAmount, 10_000e18, "Single project gets full pool");
        
        vm.startPrank(donor2);
        token.approve(address(qf), 100e18);
        qf.contribute(pid1, 100e18);
        vm.stopPrank();

        vm.prank(admin);
        qf.calculateMatching();
        
        (,,, matchedAmount,,) = qf.projects(pid1);
        assertTrue(matchedAmount > 0, "Match should be positive");
    }
}