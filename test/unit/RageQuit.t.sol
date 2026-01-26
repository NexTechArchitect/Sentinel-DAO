// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {RageQuit} from "../../src/contracts/governance/RageQuit.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {MockERC20} from "./DAOTreasury.t.sol"; 
import {ZeroAmount} from "../../src/contracts/errors/CommonErrors.sol";

contract RageQuitTest is Test {
    RageQuit public rageQuit;
    DAOTreasury public treasury;
    GovernanceToken public govToken;
    MockERC20 public paymentToken;

    address public admin = makeAddr("admin");
    address public user = makeAddr("user");
    address public treasuryAddr;

    function setUp() public {
        vm.deal(admin, 100 ether);
        vm.startPrank(admin);

        govToken = new GovernanceToken(admin, admin);
        paymentToken = new MockERC20();

        treasury = new DAOTreasury(admin);
        treasuryAddr = address(treasury);

        rageQuit = new RageQuit(address(govToken), treasuryAddr);

      
        treasury.setRageQuitContract(address(rageQuit));

        (bool sent, ) = treasuryAddr.call{value: 10 ether}("");
        require(sent, "ETH Funding failed");
        
        bool success = paymentToken.transfer(treasuryAddr, 10_000 * 10**18);
        require(success, "Token Funding failed");

      
        govToken.mint(user, 10_000 * 10**18);
        
        govToken.mint(admin, 90_000 * 10**18);

        vm.stopPrank();

        vm.prank(user);
        govToken.approve(address(rageQuit), type(uint256).max);
    }

  
    function calculateExpectedShare(uint256 burnAmount, uint256 treasuryBalance) internal view returns (uint256) {
        uint256 total = govToken.totalSupply();
        return (burnAmount * treasuryBalance) / total;
    }

    
    function test_Quit_ETH_Success() public {
        address[] memory assets = new address[](1);
        assets[0] = address(0); 

        uint256 burnAmount = 10_000 * 10**18;
        uint256 balBefore = user.balance;

        uint256 expectedEth = calculateExpectedShare(burnAmount, 10 ether);

        vm.prank(user);
        rageQuit.quit(assets, burnAmount);

        assertEq(user.balance, balBefore + expectedEth);
        assertEq(govToken.balanceOf(user), 0);
        assertTrue(rageQuit.hasRageQuit(user));
    }


    function test_Quit_ERC20_Success() public {
        address[] memory assets = new address[](1);
        assets[0] = address(paymentToken); 

        uint256 burnAmount = 10_000 * 10**18;

        
        uint256 expectedTokens = calculateExpectedShare(burnAmount, 10_000 * 10**18);

        vm.prank(user);
        rageQuit.quit(assets, burnAmount);

        assertEq(paymentToken.balanceOf(user), expectedTokens);
        assertEq(govToken.balanceOf(user), 0);
    }

  
    function test_Quit_Batch_Success() public {
        address[] memory assets = new address[](2);
        assets[0] = address(0);
        assets[1] = address(paymentToken);

        uint256 burnAmount = 10_000 * 10**18;
        uint256 ethBefore = user.balance;

       
        uint256 expectedEth = calculateExpectedShare(burnAmount, 10 ether);
        uint256 expectedTokens = calculateExpectedShare(burnAmount, 10_000 * 10**18);

        vm.prank(user);
        rageQuit.quit(assets, burnAmount);

        assertEq(user.balance, ethBefore + expectedEth);
        assertEq(paymentToken.balanceOf(user), expectedTokens);
    }

    function test_RevertIf_AlreadyQuit() public {
        address[] memory assets = new address[](1);
        assets[0] = address(0);
        
        vm.startPrank(user);
        rageQuit.quit(assets, 5_000 * 10**18);
        
        vm.expectRevert(RageQuit.AlreadyRageQuit.selector);
        rageQuit.quit(assets, 5_000 * 10**18);
        vm.stopPrank();
    }

    function test_RevertIf_ZeroAmount() public {
        address[] memory assets = new address[](1);
        assets[0] = address(0);

        vm.prank(user);
        vm.expectRevert(ZeroAmount.selector);
        rageQuit.quit(assets, 0);
    }

    function test_Quit_ZeroShare_DoesNotRevert() public {
        address[] memory assets = new address[](1);
        assets[0] = address(paymentToken);

        uint256 burnAmount = 1; 
        
        vm.prank(user);
        rageQuit.quit(assets, burnAmount);

        assertTrue(rageQuit.hasRageQuit(user));
        assertEq(paymentToken.balanceOf(user), 0);
    }
}