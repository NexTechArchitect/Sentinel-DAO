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
import {ProposalGuard} from "../../src/contracts/governance/ProposalGuard.sol";
import {QuadraticFunding} from "../../src/contracts/governance/QuadraticFunding.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

contract FuzzDAO_SystemStress is Test {
    DAOCore core;
    RoleManager roles;
    GovernanceToken token;
    DAOConfig config;
    DAOTimelock timelock;
    DAOTreasury treasury;
    HybridGovernorDynamic governor;
    VetoCouncil veto;
    RageQuit rageQuit;
    ProposalGuard guard;
    QuadraticFunding qf;

    address admin = makeAddr("admin");
    address user = makeAddr("user");

    function setUp() public {
        vm.startPrank(admin);
        uint256 nonce = vm.getNonce(admin);

        address predGov = vm.computeCreateAddress(admin, nonce + 8); 
        address predVeto = vm.computeCreateAddress(admin, nonce + 9);

        roles = new RoleManager(admin);
        token = new GovernanceToken(admin, admin);

        address[] memory props = new address[](1); props[0] = predGov;
        address[] memory execs = new address[](2); execs[0] = admin; execs[1] = predGov;
        timelock = new DAOTimelock(1 days, props, execs, address(0)); 
        config = new DAOConfig(address(timelock), 1 hours, 1 days, 100e18, 4);
        treasury = new DAOTreasury(address(timelock));
        
        rageQuit = new RageQuit(address(token), address(treasury));
        qf = new QuadraticFunding(address(roles), address(token));
        guard = new ProposalGuard(predGov);

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
        require(address(governor) == predGov, "Governor Prediction Failed");

        veto = new VetoCouncil(address(roles), address(governor));
        
        vm.stopPrank();
        
        vm.startPrank(admin);

        core = new DAOCore(address(roles), address(token));
        core.linkCoreModules(address(governor), address(treasury), address(timelock));
        core.lockSetup();

        token.mint(admin, 1000e18);
        token.approve(address(qf), 1000e18);
        qf.fundMatchingPool(1000e18);

        vm.stopPrank();
    }
    function testFuzz_EndToEndChaos(uint96 treasuryFunds, uint96 userTokens, uint96 proposalAsk) public {
        vm.assume(treasuryFunds > 1 ether && treasuryFunds < 1_000_000 ether);
        vm.assume(userTokens > 10_000e18 && userTokens < 100_000_000e18);
        vm.assume(proposalAsk > 0 && proposalAsk < treasuryFunds);

        vm.deal(address(treasury), treasuryFunds);
        
        vm.prank(admin);
        token.mint(user, userTokens);

        vm.prank(user);
        token.delegate(user); 

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(treasury);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transferEth(address,uint256)", payable(user), proposalAsk);

        string memory desc = "Stress Test Proposal: Asking for funds.";
        bytes32 descHash = keccak256(bytes(desc));

        vm.prank(user);
        
        // Try/Catch block to handle any Governor restrictions safely
        try governor.propose(targets, values, calldatas, desc) returns (uint256 pid) {
            vm.roll(block.number + config.votingDelay() + 1);
            vm.warp(block.timestamp + config.votingDelay() + 1);

            vm.prank(user);
            governor.castVote(pid, 1);

            vm.roll(block.number + config.votingPeriod() + 1);
            vm.warp(block.timestamp + config.votingPeriod() + 1);

            if (governor.state(pid) == IGovernor.ProposalState.Succeeded) {
                governor.queue(targets, values, calldatas, descHash);
                vm.warp(block.timestamp + timelock.getMinDelay() + 1);
                governor.execute(targets, values, calldatas, descHash);
                assertEq(user.balance, proposalAsk);
            }
        } catch {
          
        }

        vm.startPrank(user);
        uint256 currentTreasuryBal = address(treasury).balance;
        uint256 supply = token.totalSupply();
        uint256 userBalBefore = user.balance;

        if (currentTreasuryBal > 0) {
            token.approve(address(rageQuit), userTokens);
            address[] memory assets = new address[](1);
            assets[0] = address(0);

            rageQuit.quit(assets, userTokens);

            uint256 fairShare = (uint256(userTokens) * uint256(currentTreasuryBal)) / supply;
            assertApproxEqAbs(user.balance, userBalBefore + fairShare, 1);
        }
        vm.stopPrank();
    }
}