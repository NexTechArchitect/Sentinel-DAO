// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {HybridGovernorDynamic} from "../../src/contracts/core/HybridGovernorDynamic.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";
import {VetoCouncil} from "../../src/contracts/governance/VetoCouncil.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract HybridGovernorDynamicTest is Test {
    HybridGovernorDynamic public governor;
    GovernanceToken public token;
    DAOConfig public config;
    TimelockController public timelock;
    VetoCouncil public vetoCouncil;
    RoleManager public roleManager;

    address admin = address(1);
    address proposer = address(2);
    address voter1 = address(3);
    address voter2 = address(4);
    address guardian = address(5);

    function setUp() public {
        vm.startPrank(admin);

        roleManager = new RoleManager(admin);
        
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = admin; 
        executors[0] = address(0);
        timelock = new TimelockController(2 days, proposers, executors, admin);

        token = new GovernanceToken(admin, address(timelock));
        
        vm.stopPrank();
        
        vm.startPrank(address(timelock));
        token.mint(proposer, 100_000 * 10**18);
        token.mint(voter1, 300_000 * 10**18);
        token.mint(voter2, 300_000 * 10**18);
        vm.stopPrank();
        
        vm.startPrank(admin);

        config = new DAOConfig(
            address(timelock),
            1 days,
            7 days,
            1000 * 10**18,
            4
        );

        governor = new HybridGovernorDynamic(
            IVotes(address(token)),
            timelock,
            config,
            address(1), // Temp address
            4
        );

        vetoCouncil = new VetoCouncil(address(roleManager), address(governor));
        
        governor = new HybridGovernorDynamic(
            IVotes(address(token)),
            timelock,
            config,
            address(vetoCouncil),
            4
        );

        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(governor));
        roleManager.grantRole(roleManager.GUARDIAN_ROLE(), guardian);

        vm.stopPrank();

        vm.prank(proposer);
        token.delegate(proposer);
        
        vm.prank(voter1);
        token.delegate(voter1);
        
        vm.prank(voter2);
        token.delegate(voter2);

        vm.roll(block.number + 1);
    }

    function testConstructorSuccess() public view {
        assertEq(governor.name(), "HybridDAO");
        assertEq(address(governor.token()), address(token));
        assertEq(governor.spamThresholdTokens(), 10000 * 10**18);
        assertEq(governor.MIN_REPUTATION(), -1000);
        assertEq(governor.MAX_REPUTATION(), 10000);
    }

    function testConstructorZeroConfig() public {
        vm.expectRevert(HybridGovernorDynamic.ZeroAddress.selector);
        new HybridGovernorDynamic(
            IVotes(address(token)),
            timelock,
            DAOConfig(address(0)),
            address(vetoCouncil),
            4
        );
    }

    function testProposeSuccess() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, string memory d) = _proposal(100);
        
        vm.prank(proposer);
        uint256 pid = governor.propose(t, v, c, d);
        
        assertTrue(pid > 0);
        assertEq(governor.proposalProposer(pid), proposer);
    }

    function testProposeArrayMismatch() public {
        address[] memory t = new address[](2);
        uint256[] memory v = new uint256[](1);
        bytes[] memory c = new bytes[](1);
        string memory d = "Test"; 
        
        vm.expectRevert(HybridGovernorDynamic.ArrayLengthMismatch.selector);
        vm.prank(proposer);
        governor.propose(t, v, c, d);
    }

    function testProposeShortDescription() public {
        address[] memory t = new address[](0);
        uint256[] memory v = new uint256[](0);
        bytes[] memory c = new bytes[](0);
        
        vm.expectRevert(abi.encodeWithSelector(
            HybridGovernorDynamic.DescriptionTooShort.selector, 
            5, 
            100
        ));
        vm.prank(proposer);
        governor.propose(t, v, c, "short");
    }

    function testProposeCooldown() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, ) = _proposal(100);
        
        vm.startPrank(proposer);
        governor.propose(t, v, c, _desc(100));
        
        vm.expectRevert(); 
        governor.propose(t, v, c, _desc(101));
        
        vm.warp(block.timestamp + 1 days + 1);
        governor.propose(t, v, c, _desc(102));
        vm.stopPrank();
    }

    function testProposeMaxActive() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, ) = _proposal(100);
        
        vm.startPrank(proposer);
        for (uint256 i = 0; i < 10; i++) {
            governor.propose(t, v, c, _desc(100 + i));
            vm.warp(block.timestamp + 1 days + 1);
        }
        
        vm.expectRevert(HybridGovernorDynamic.MaxProposalsReached.selector);
        governor.propose(t, v, c, _desc(200));
        vm.stopPrank();
    }

    function testCancelProposal() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, string memory d) = _proposal(100);
        
        vm.startPrank(proposer);
        governor.propose(t, v, c, d);
        
        int256 rep = governor.proposerReputation(proposer);
        governor.cancel(t, v, c, keccak256(bytes(d)));
        
        assertEq(governor.proposerReputation(proposer), rep - 50);
        vm.stopPrank();
    }

    function testReputationCap() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, ) = _proposal(100);
        
        vm.startPrank(proposer);
        
        for (uint256 i = 0; i < 19; i++) {
            string memory d = _desc(100 + i);
            governor.propose(t, v, c, d);
            vm.warp(block.timestamp + 1 days + 1);
            governor.cancel(t, v, c, keccak256(bytes(d)));
            vm.warp(block.timestamp + 1 days + 1);
        }
        
        assertEq(governor.proposerReputation(proposer), -950);
        
        string memory d20 = _desc(200);
        governor.propose(t, v, c, d20);
        vm.warp(block.timestamp + 1 days + 1);
        governor.cancel(t, v, c, keccak256(bytes(d20)));
        assertEq(governor.proposerReputation(proposer), governor.MIN_REPUTATION());
        
        string memory d21 = _desc(201);
        vm.warp(block.timestamp + 1 days + 1);
        governor.propose(t, v, c, d21);
        vm.warp(block.timestamp + 1 days + 1);
        governor.cancel(t, v, c, keccak256(bytes(d21)));
        
        assertEq(governor.proposerReputation(proposer), governor.MIN_REPUTATION());
        
        vm.stopPrank();
    }

    function testVetoProposal() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, string memory d) = _proposal(100);
        
        vm.prank(proposer);
        uint256 pid = governor.propose(t, v, c, d);
        
        assertTrue(!vetoCouncil.isVetoed(pid));
    }

    function testViewFunctions() public view {
        assertEq(governor.votingDelay(), 1 days);
        assertEq(governor.votingPeriod(), 7 days);
        assertEq(governor.proposalThreshold(), 1000 * 10**18);
    }

    function testRecordTokenAcquisition() public {
        vm.prank(address(token));
        governor.recordTokenAcquisition(proposer);
        
        assertEq(governor.tokenAcquisitionTime(proposer), block.timestamp);
    }

    function _desc(uint256 seed) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "This is a comprehensive test proposal description with enough characters to meet the minimum requirement of 100 characters for governance. Seed: ",
            vm.toString(seed)
        ));
    }

    function _proposal(uint256 seed) internal pure returns (
        address[] memory t,
        uint256[] memory v,
        bytes[] memory c,
        string memory d
    ) {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(0);
        v[0] = 0;
        c[0] = "";
        d = _desc(seed);
    }
}