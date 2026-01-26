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
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1_000_000e18);
    }
}

contract DAOIntegration_Treasury is Test {
    RoleManager roles;
    GovernanceToken govToken;
    MockUSDC usdc;
    DAOConfig config;
    DAOTimelock timelock;
    DAOTreasury treasury;
    HybridGovernorDynamic governor;
    VetoCouncil veto;
    DAOCore core;

    address admin = makeAddr("admin");
    address proposer = makeAddr("proposer");
    address voter1 = makeAddr("voter1");
    address receiver1 = makeAddr("receiver1");
    address receiver2 = makeAddr("receiver2");
    address receiver3 = makeAddr("receiver3");

    function setUp() public {
        vm.startPrank(admin);

        roles = new RoleManager(admin);
        govToken = new GovernanceToken(admin, admin);
        usdc = new MockUSDC();

        uint256 nonce = vm.getNonce(admin);
        address predictedGov = vm.computeCreateAddress(admin, nonce + 3);
        address predictedVeto = vm.computeCreateAddress(admin, nonce + 4);

        address[] memory proposers = new address[](1); proposers[0] = predictedGov;
        address[] memory executors = new address[](2); 
        executors[0] = admin; 
        executors[1] = predictedGov; 

        timelock = new DAOTimelock(1 days, proposers, executors, address(0));
        config = new DAOConfig(address(timelock), 1 hours, 1 days, 100e18, 4);
        treasury = new DAOTreasury(address(timelock));

        governor = new HybridGovernorDynamic(
            IVotes(address(govToken)), 
            TimelockController(payable(address(timelock))), 
            config, 
            predictedVeto, 
            4
        );
        veto = new VetoCouncil(address(roles), address(governor));
        core = new DAOCore(address(roles), address(govToken));
        
        core.linkCoreModules(address(governor), address(treasury), address(timelock));
        core.lockSetup();

       
        require(usdc.transfer(address(treasury), 100_000e18), "Treasury funding failed"); 

       
        govToken.mint(proposer, 10_000e18);
        govToken.mint(voter1, 8_000_000e18); // Enough for Quorum
        vm.stopPrank();

        vm.prank(proposer); govToken.delegate(proposer);
        vm.prank(voter1); govToken.delegate(voter1);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);
    }

    function test_Treasury_SingleERC20Transfer() public {
        address[] memory targets = new address[](1); targets[0] = address(treasury);
        uint256[] memory values = new uint256[](1); values[0] = 0;
        
      
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transferERC20(address,address,uint256)", 
            address(usdc), 
            receiver1, 
            5000e18
        );

        string memory desc = "Proposal: Pay 5000 USDC to receiver1 for marketing services. This description is long enough to pass validation.";

     
        vm.prank(proposer);
        uint256 pid = governor.propose(targets, values, calldatas, desc);

        vm.roll(block.number + config.votingDelay() + 1);
        vm.warp(block.timestamp + config.votingDelay() + 1);
        
        vm.prank(voter1);
        governor.castVote(pid, 1);

        vm.roll(block.number + config.votingPeriod() + 1);
        vm.warp(block.timestamp + config.votingPeriod() + 1);

    
        bytes32 descHash = keccak256(bytes(desc));
        governor.queue(targets, values, calldatas, descHash);

        vm.warp(block.timestamp + timelock.getMinDelay() + 1);
        governor.execute(targets, values, calldatas, descHash);

        assertEq(usdc.balanceOf(receiver1), 5000e18, "Receiver1 should have USDC");
        assertEq(usdc.balanceOf(address(treasury)), 95000e18, "Treasury should decrease");
    }

    function test_Treasury_BatchTransfer() public {
        address[] memory recipients = new address[](3);
        recipients[0] = receiver1;
        recipients[1] = receiver2;
        recipients[2] = receiver3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1000e18;
        amounts[1] = 2000e18;
        amounts[2] = 3000e18;

        address[] memory targets = new address[](1); targets[0] = address(treasury);
        uint256[] memory values = new uint256[](1); values[0] = 0;

       
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "batchTransferERC20(address,address[],uint256[])",
            address(usdc),
            recipients,
            amounts
        );

        string memory desc = "Proposal: Batch payroll execution for 3 contributors. Validating gas optimized batch transfer function.";

        
        vm.prank(proposer);
        uint256 pid = governor.propose(targets, values, calldatas, desc);

        vm.roll(block.number + config.votingDelay() + 1);
        vm.warp(block.timestamp + config.votingDelay() + 1);
        vm.prank(voter1);
        governor.castVote(pid, 1);

        vm.roll(block.number + config.votingPeriod() + 1);
        vm.warp(block.timestamp + config.votingPeriod() + 1);
        
        bytes32 descHash = keccak256(bytes(desc));
        governor.queue(targets, values, calldatas, descHash);
        
        vm.warp(block.timestamp + timelock.getMinDelay() + 1);
        governor.execute(targets, values, calldatas, descHash);

        assertEq(usdc.balanceOf(receiver1), 1000e18);
        assertEq(usdc.balanceOf(receiver2), 2000e18);
        assertEq(usdc.balanceOf(receiver3), 3000e18);
        assertEq(usdc.balanceOf(address(treasury)), 94000e18); // 100k - 6k
    }
}