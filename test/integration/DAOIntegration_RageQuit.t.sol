// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {RageQuit} from "../../src/contracts/governance/RageQuit.sol";

contract DAOIntegration_RageQuit is Test {
    RoleManager roles;
    GovernanceToken token;
    DAOTimelock timelock;
    DAOTreasury treasury;
    RageQuit rageQuit;

    address admin = makeAddr("admin");
    address quitter = makeAddr("quitter");
    address stayer = makeAddr("stayer");

    function setUp() public {
        vm.startPrank(admin);

        roles = new RoleManager(admin);
        token = new GovernanceToken(admin, admin);

        address[] memory proposers = new address[](1); proposers[0] = admin;
        address[] memory executors = new address[](1); executors[0] = admin;
        timelock = new DAOTimelock(1 days, proposers, executors, address(0));
        treasury = new DAOTreasury(address(timelock));

        rageQuit = new RageQuit(address(token), address(treasury));

        vm.stopPrank();
        
        vm.prank(address(timelock)); 
        treasury.setRageQuitContract(address(rageQuit));

        vm.startPrank(admin);
        token.mint(quitter, 100e18); 
        token.mint(stayer, 900e18);  
        vm.stopPrank();

    
        vm.deal(address(treasury), 10 ether); 
    }
function test_RageQuit_ProRataExit() public {
        vm.startPrank(quitter);
        
        uint256 quitAmount = 100e18;
        token.approve(address(rageQuit), quitAmount);

        address[] memory assets = new address[](1);
        assets[0] = address(0); 

        uint256 balanceBefore = quitter.balance;
        
        
        uint256 currentSupply = token.totalSupply();
        uint256 treasuryEth = address(treasury).balance;
        
        
        uint256 expectedShare = (quitAmount * treasuryEth) / currentSupply;

        rageQuit.quit(assets, quitAmount);

        uint256 balanceAfter = quitter.balance;

        
        assertEq(balanceAfter - balanceBefore, expectedShare, "Payout should match pro-rata formula");
        
        assertEq(token.balanceOf(quitter), 0, "User tokens should be gone");
        
        vm.stopPrank();
    }
    function test_RageQuit_CannotDoubleDip() public {
        vm.startPrank(quitter);
        token.approve(address(rageQuit), 100e18);
        address[] memory assets = new address[](1);
        assets[0] = address(0);

      
        rageQuit.quit(assets, 50e18); 

       
        vm.expectRevert(); 
        rageQuit.quit(assets, 50e18);
        
        vm.stopPrank();
    }
}