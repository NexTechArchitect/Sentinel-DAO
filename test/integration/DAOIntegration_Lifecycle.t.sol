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

contract DAOIntegration_Lifecycle is Test {
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
    address voter1 = makeAddr("voter1");
    address voter2 = makeAddr("voter2");
    address receiver = makeAddr("receiver");

  function setUp() public {
        vm.startPrank(admin);

        roles = new RoleManager(admin);
        token = new GovernanceToken(admin, admin);

        uint256 currentNonce = vm.getNonce(admin);
        address predictedGovernor = vm.computeCreateAddress(admin, currentNonce + 3);
        address predictedVeto = vm.computeCreateAddress(admin, currentNonce + 4);

        address[] memory proposers = new address[](1);
        proposers[0] = predictedGovernor;
        
        address[] memory executors = new address[](2);
        executors[0] = admin; 
        executors[1] = predictedGovernor; 
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

        veto = new VetoCouncil(address(roles), address(governor));
        core = new DAOCore(address(roles), address(token));
        core.linkCoreModules(address(governor), address(treasury), address(timelock));
        core.lockSetup();

        vm.stopPrank();

        vm.startPrank(admin);
        token.mint(proposer, 10_000e18);
        token.mint(voter1, 4_000_000e18); 
        token.mint(voter2, 4_000_000e18);
        vm.stopPrank();

        vm.prank(proposer); token.delegate(proposer);
        vm.prank(voter1); token.delegate(voter1);
        vm.prank(voter2); token.delegate(voter2);

        vm.deal(address(treasury), 10 ether);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);
    }

    function test_Lifecycle_HappyPath() public {
        address[] memory targets = new address[](1);
        targets[0] = address(treasury);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("transferEth(address,uint256)", payable(receiver), 1 ether);
        
        string memory desc = "Proposal #1: Grant 1 ETH to receiver for development work. This description is now long enough to pass the one hundred character minimum validation requirement enforced by the Governor contract.";

        vm.prank(proposer);
        uint256 pid = governor.propose(targets, values, calldatas, desc);

        vm.warp(block.timestamp + config.votingDelay() + 1);
        vm.roll(block.number + config.votingDelay() + 1); 

        assertEq(uint8(governor.state(pid)), 1, "Proposal should be Active");

        vm.prank(voter1);
        governor.castVote(pid, 1); 
        
        vm.prank(voter2);
        governor.castVote(pid, 1); 

        vm.warp(block.timestamp + config.votingPeriod() + 1);
        vm.roll(block.number + config.votingPeriod() + 1);

        assertEq(uint8(governor.state(pid)), 4, "Proposal should have Succeeded");

        bytes32 descriptionHash = keccak256(bytes(desc));
        governor.queue(targets, values, calldatas, descriptionHash);
        
        assertEq(uint8(governor.state(pid)), 5, "Proposal should be Queued");

        vm.warp(block.timestamp + timelock.getMinDelay() + 1);
        
        uint256 balanceBefore = receiver.balance;
        
        governor.execute(targets, values, calldatas, descriptionHash);
        
        assertEq(uint8(governor.state(pid)), 7, "Proposal should be Executed");
        assertEq(receiver.balance, balanceBefore + 1 ether, "Receiver should have received ETH");
    }

    function test_Lifecycle_VetoCancelsExecution() public {
        address[] memory targets = new address[](1); targets[0] = address(0);
        uint256[] memory values = new uint256[](1); values[0] = 0;
        bytes[] memory calldatas = new bytes[](1); calldatas[0] = "";
        
        string memory desc = "Malicious Proposal: This should be vetoed by the council before it executes. We need a very long description to ensure that the proposal is accepted by the Governor initially so we can test the Veto logic.";

        vm.prank(proposer);
        uint256 pid = governor.propose(targets, values, calldatas, desc);

        address guardian = makeAddr("guardian");
        
        vm.startPrank(admin); 
        roles.grantRole(roles.GUARDIAN_ROLE(), guardian);
        
        address g2 = makeAddr("g2");
        address g3 = makeAddr("g3");
        roles.grantRole(roles.GUARDIAN_ROLE(), g2);
        roles.grantRole(roles.GUARDIAN_ROLE(), g3);
        vm.stopPrank(); 

        vm.prank(guardian); veto.castVeto(pid);
        vm.prank(g2); veto.castVeto(pid);
        vm.prank(g3); veto.castVeto(pid);

        assertEq(uint8(governor.state(pid)), 3, "Proposal should be Defeated by Veto"); 
        
        vm.expectRevert(); 
        governor.queue(targets, values, calldatas, keccak256(bytes(desc)));
    }
}