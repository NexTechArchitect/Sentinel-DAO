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
import {RageQuit} from "../../src/contracts/governance/RageQuit.sol";
import {QuadraticFunding} from "../../src/contracts/governance/QuadraticFunding.sol";
import {VotingStrategies} from "../../src/contracts/governance/VotingStrategies.sol";

import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract DAO_Master_Integration is Test {
   
    DAOCore core;
    RoleManager roles;
    GovernanceToken token;
    DAOConfig config;
    DAOTimelock timelock;
    DAOTreasury treasury;
    HybridGovernorDynamic governor;
    VetoCouncil veto;
    RageQuit rageQuit;
    QuadraticFunding qf;

    address admin = makeAddr("admin");
    address guardian = makeAddr("guardian");
    address proposer = makeAddr("proposer");
    address whaleVoter = makeAddr("whaleVoter"); 
    address communityVoter = makeAddr("communityVoter");
    address employee = makeAddr("employee");
    address quitter = makeAddr("quitter");

    function setUp() public {
        vm.startPrank(admin);

        roles = new RoleManager(admin);
        token = new GovernanceToken(admin, admin);

      
        uint256 nonce = vm.getNonce(admin);
        address predGov = vm.computeCreateAddress(admin, nonce + 5); 
        address predVeto = vm.computeCreateAddress(admin, nonce + 6);

       
        address[] memory props = new address[](1); props[0] = predGov;
        address[] memory execs = new address[](2); execs[0] = admin; execs[1] = predGov;
        
        timelock = new DAOTimelock(1 days, props, execs, address(0)); 

        config = new DAOConfig(address(timelock), 1 hours, 1 days, 100e18, 4);
        treasury = new DAOTreasury(address(timelock));
        
        rageQuit = new RageQuit(address(token), address(treasury));
        qf = new QuadraticFunding(address(roles), address(token));

       
        vm.stopPrank();
        vm.prank(address(timelock));
        treasury.setRageQuitContract(address(rageQuit));
        vm.startPrank(admin);

       
        governor = new HybridGovernorDynamic(
            IVotes(address(token)),
            TimelockController(payable(address(timelock))),
            config,
            predVeto,
            4
        );
        
        
        require(address(governor) == predGov, "Governor Address Prediction Failed");

        veto = new VetoCouncil(address(roles), address(governor));
        
      
        core = new DAOCore(address(roles), address(token));
        core.linkCoreModules(address(governor), address(treasury), address(timelock));
        core.lockSetup();

        vm.deal(address(treasury), 50 ether); 
        
        token.mint(proposer, 10_000e18);
        token.mint(whaleVoter, 10_000_000e18); 
        token.mint(communityVoter, 500_000e18);
        token.mint(quitter, 1_000_000e18); 

        vm.stopPrank();

        vm.prank(proposer); token.delegate(proposer);
        vm.prank(whaleVoter); token.delegate(whaleVoter);
        vm.prank(communityVoter); token.delegate(communityVoter);
        vm.prank(quitter); token.delegate(quitter);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);
    }

    function test_Master_FullDAOLifecycle() public {
      
        address[] memory targets = new address[](2);
        uint256[] memory values = new uint256[](2);
        bytes[] memory calldatas = new bytes[](2);

        
        targets[0] = address(treasury);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transferEth(address,uint256)", payable(employee), 5 ether);

       
        targets[1] = address(governor);
        values[1] = 0;
        calldatas[1] = abi.encodeWithSignature("updateVotingStrategy(uint8)", uint8(VotingStrategies.Strategy.QuadraticWeighted));

        
        string memory desc = "Master Proposal: Pay employee bonus and upgrade DAO to Quadratic Voting strategy. We are doing this to ensure a more fair governance system where smaller holders have a bigger voice. This description is now definitely long enough to pass the validation check.";
        bytes32 descHash = keccak256(bytes(desc));

        vm.prank(proposer);
        uint256 pid = governor.propose(targets, values, calldatas, desc);

        assertEq(uint8(governor.currentStrategy()), uint8(VotingStrategies.Strategy.TokenWeighted)); 
        
        vm.roll(block.number + config.votingDelay() + 1);
        vm.warp(block.timestamp + config.votingDelay() + 1);

        vm.prank(whaleVoter);
        governor.castVote(pid, 1); 

        vm.prank(communityVoter);
        governor.castVote(pid, 1); 

        vm.roll(block.number + config.votingPeriod() + 1);
        vm.warp(block.timestamp + config.votingPeriod() + 1);

        assertEq(uint8(governor.state(pid)), 4, "Proposal Succeeded");

       
        governor.queue(targets, values, calldatas, descHash);
        
        vm.warp(block.timestamp + timelock.getMinDelay() + 1);

        uint256 employeeBalBefore = employee.balance;
        
        governor.execute(targets, values, calldatas, descHash);

        assertEq(employee.balance, employeeBalBefore + 5 ether, "Employee got paid");
        
       
        assertEq(uint8(governor.currentStrategy()), uint8(VotingStrategies.Strategy.QuadraticWeighted), "Strategy updated to Quadratic");

        
        vm.startPrank(quitter);
        uint256 quitAmount = token.balanceOf(quitter);
        token.approve(address(rageQuit), quitAmount);

        address[] memory assets = new address[](1);
        assets[0] = address(0); 

        uint256 treasuryBal = address(treasury).balance; 
        uint256 supply = token.totalSupply();
        
        uint256 expectedShare = (quitAmount * treasuryBal) / supply;
        uint256 balBefore = quitter.balance;

        rageQuit.quit(assets, quitAmount);

        assertEq(quitter.balance, balBefore + expectedShare, "RageQuit Payout Correct");
        vm.stopPrank();
    }
}