// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {RageQuit} from "../../src/contracts/governance/RageQuit.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";

contract FuzzDAO is Test {
    GovernanceToken token;
    DAOTreasury treasury;
    RageQuit rageQuit;
    DAOTimelock timelock;

    address admin = makeAddr("admin");
    address user = makeAddr("user");

    function setUp() public {
        vm.startPrank(admin);
        token = new GovernanceToken(admin, admin);
        
        address[] memory proposers = new address[](1); proposers[0] = admin;
        address[] memory executors = new address[](1); executors[0] = admin;
        
        timelock = new DAOTimelock(1 days, proposers, executors, address(0));
        treasury = new DAOTreasury(address(timelock));
        rageQuit = new RageQuit(address(token), address(treasury));

        vm.stopPrank();
        
        vm.prank(address(timelock)); 
        treasury.setRageQuitContract(address(rageQuit));
    }

    function testFuzz_RageQuitMath(uint96 treasuryBalance, uint96 quitAmount) public {
        // Constraints
        vm.assume(quitAmount > 0); 
        vm.assume(treasuryBalance > 1 ether); 
        vm.assume(treasuryBalance < 1_000_000_000 ether);
        
       
        vm.assume(quitAmount < 800_000_000 * 1e18);

        vm.deal(address(treasury), treasuryBalance);
        
        vm.prank(admin);
        token.mint(user, quitAmount);
        
        uint256 totalSupply = token.totalSupply(); 
        uint256 expectedShare = (uint256(quitAmount) * uint256(treasuryBalance)) / totalSupply;

        vm.startPrank(user);
        token.approve(address(rageQuit), quitAmount);
        
        address[] memory assets = new address[](1);
        assets[0] = address(0); 

        uint256 balBefore = user.balance;
        rageQuit.quit(assets, quitAmount);
        
        uint256 received = user.balance - balBefore;
        
        assertApproxEqAbs(received, expectedShare, 1, "Math broken");
        vm.stopPrank();
    }

    function testFuzz_TreasuryTransfers(uint96 amount) public {
        vm.assume(amount > 0);
        uint256 startBal = 1000 ether;
        vm.assume(amount <= startBal); 
        
        vm.deal(address(treasury), startBal);
        
        vm.prank(address(timelock));
        treasury.transferEth(payable(user), amount);

        assertEq(address(treasury).balance, startBal - amount);
        assertEq(user.balance, amount);
    }

    function testFuzz_VotingPower(uint96 mintAmount) public {
        vm.assume(mintAmount > 0);
       
        vm.assume(mintAmount < 800_000_000 * 1e18);
        
        address voter = makeAddr("voter");
        
        vm.prank(admin);
        token.mint(voter, mintAmount);

        assertEq(token.getVotes(voter), 0);

        vm.prank(voter);
        token.delegate(voter);

        assertEq(token.getVotes(voter), mintAmount);
    }
}