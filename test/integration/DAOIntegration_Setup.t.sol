// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {HybridGovernorDynamic} from "../../src/contracts/core/HybridGovernorDynamic.sol";
import {VetoCouncil} from "../../src/contracts/governance/VetoCouncil.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract DAOIntegration_Setup is Test {
    DAOCore core;
    RoleManager roles;
    GovernanceToken token;
    DAOConfig config;
    DAOTimelock timelock;
    DAOTreasury treasury;
    HybridGovernorDynamic governor;
    VetoCouncil veto;

    address admin = makeAddr("admin");
    address proposer = makeAddr("proposer");
    address guardian = makeAddr("guardian");

    function setUp() public {
        vm.startPrank(admin);

       
        roles = new RoleManager(admin);
        token = new GovernanceToken(admin, admin);

      
        uint256 currentNonce = vm.getNonce(admin);
        
        address predictedGovernor = vm.computeCreateAddress(admin, currentNonce + 3);
        address predictedVeto = vm.computeCreateAddress(admin, currentNonce + 4);

        address[] memory proposers = new address[](1);
        proposers[0] = predictedGovernor; 
        
        address[] memory executors = new address[](1);
        executors[0] = admin; 

        
        timelock = new DAOTimelock(1 days, proposers, executors, address(0));

       
        config = new DAOConfig(address(timelock), 1 hours, 1 days, 100e18, 4);
        treasury = new DAOTreasury(address(timelock));

        
        governor = new HybridGovernorDynamic(
            IVotes(address(token)),
            TimelockController(payable(address(timelock))),
            config,
            predictedVeto,
            4
        );

        
        require(address(governor) == predictedGovernor, "Governor Address Mismatch");

        
        veto = new VetoCouncil(address(roles), address(governor));

        
        core = new DAOCore(address(roles), address(token));
        core.linkCoreModules(address(governor), address(treasury), address(timelock));
        core.lockSetup();

       
        roles.grantRole(roles.GUARDIAN_ROLE(), guardian);
        
        vm.stopPrank();

       
        vm.prank(admin);
        token.mint(proposer, 1000e18);
        vm.prank(proposer);
        token.delegate(proposer);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);
    }

    function test_Integration_CoreLockdown() public {
        vm.expectRevert(); 
        core.linkCoreModules(address(0), address(0), address(0));
    }

    function test_Integration_GovernorConfigSync() view public {
        assertEq(governor.votingDelay(), 1 hours);
        assertEq(governor.votingPeriod(), 1 days);
        assertEq(governor.proposalThreshold(), 100e18);
        
        uint256 expectedQuorum = (token.totalSupply() * 4) / 100;
        assertEq(governor.quorum(block.number - 1), expectedQuorum);
    }

    function test_Integration_ConfigSecurity() public {
        vm.prank(address(timelock));
        config.setVotingDelay(2 hours);
        assertEq(governor.votingDelay(), 2 hours);
    }

    function test_Integration_TreasuryAccess() public {
        vm.startPrank(proposer);
        vm.expectRevert(); 
        treasury.transferEth(payable(proposer), 1 ether);
        vm.stopPrank();
    }
}