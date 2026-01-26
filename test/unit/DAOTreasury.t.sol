// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {ZeroAddress, ZeroAmount, ArrayLengthMismatch} from "../../src/contracts/errors/CommonErrors.sol";
import {OnlyAuthorized} from "../../src/contracts/errors/TreasuryErrors.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}

contract MockNFT is ERC721 {
    constructor() ERC721("MockNFT", "MNFT") {
        _mint(msg.sender, 1);
        _mint(msg.sender, 2);
    }
}

contract Mock1155 is ERC1155 {
    constructor() ERC1155("") {}
    function mint(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }
}

contract DAOTreasuryTest is Test, ERC1155Holder {
    DAOTreasury public treasury;
    MockERC20 public token;
    MockNFT public nft;
    Mock1155 public token1155;

    address public timelock = makeAddr("timelock");
    address public rageQuit = makeAddr("rageQuit");
    address public user = makeAddr("user");
    address public hacker = makeAddr("hacker");

    function setUp() public {
        token = new MockERC20();
        nft = new MockNFT();
        token1155 = new Mock1155();

        treasury = new DAOTreasury(timelock);

        token.transfer(user, 1000 * 10 ** 18);
        token1155.mint(user, 1, 100);
        nft.transferFrom(address(this), user, 1);

        vm.prank(timelock);
        treasury.setRageQuitContract(rageQuit);
    }

    function test_ReceiveETH() public {
        (bool sent, ) = address(treasury).call{value: 1 ether}("");
        assertTrue(sent);
        assertEq(address(treasury).balance, 1 ether);
    }

    function test_DepositETH() public {
        treasury.depositEth{value: 1 ether}();
        assertEq(address(treasury).balance, 1 ether);
    }

    function test_TransferETH_Success() public {
        (bool sent, ) = address(treasury).call{value: 10 ether}("");
        assertTrue(sent);

        uint256 balBefore = user.balance;

        vm.prank(timelock);
        treasury.transferEth(payable(user), 1 ether);

        assertEq(user.balance, balBefore + 1 ether);
    }

    function test_DepositERC20() public {
        vm.startPrank(user);
        token.approve(address(treasury), 100 * 10 ** 18);
        treasury.depositERC20(address(token), 100 * 10 ** 18);
        vm.stopPrank();

        assertEq(token.balanceOf(address(treasury)), 100 * 10 ** 18);
    }

    function test_TransferERC20_Success() public {
        uint256 amount = 100 * 10 ** 18;
        
        vm.startPrank(user);
        token.transfer(address(treasury), amount);
        vm.stopPrank();

        vm.prank(timelock);
        treasury.transferERC20(address(token), user, 50 * 10 ** 18);

        assertEq(token.balanceOf(address(treasury)), 50 * 10 ** 18);
    }

    function test_BatchTransferERC20_Success() public {
        uint256 amount = 100 * 10 ** 18;
        
        vm.startPrank(user);
        token.transfer(address(treasury), amount);
        vm.stopPrank();

        address[] memory recipients = new address[](2);
        recipients[0] = user;
        recipients[1] = hacker;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 10 * 10 ** 18;
        amounts[1] = 20 * 10 ** 18;

        vm.prank(timelock);
        treasury.batchTransferERC20(address(token), recipients, amounts);

        assertEq(token.balanceOf(address(treasury)), 70 * 10 ** 18);
    }

    function test_DepositERC721() public {
        vm.startPrank(user);
        nft.approve(address(treasury), 1);
        treasury.depositERC721(address(nft), 1);
        vm.stopPrank();
        
        assertEq(nft.ownerOf(1), address(treasury));
    }

    function test_TransferERC721_TimelockOnly() public {
        vm.startPrank(user);
        nft.approve(address(treasury), 1);
        treasury.depositERC721(address(nft), 1);
        vm.stopPrank();

        vm.prank(timelock);
        treasury.transferERC721(address(nft), user, 1);

        assertEq(nft.ownerOf(1), user);
    }

    function test_DepositERC1155() public {
        vm.startPrank(user);
        token1155.setApprovalForAll(address(treasury), true);
        treasury.depositERC1155(address(token1155), 1, 50, "");
        vm.stopPrank();
        
        assertEq(token1155.balanceOf(address(treasury), 1), 50);
    }

    function test_TransferERC1155_TimelockOnly() public {
        vm.startPrank(user);
        token1155.setApprovalForAll(address(treasury), true);
        treasury.depositERC1155(address(token1155), 1, 50, "");
        vm.stopPrank();

        vm.prank(timelock);
        treasury.transferERC1155(address(token1155), user, 1, 20, "");

        assertEq(token1155.balanceOf(user, 1), 70); 
    }

    function test_RevertIf_UnauthorizedTransferETH() public {
        vm.prank(hacker);
        vm.expectRevert(OnlyAuthorized.selector);
        treasury.transferEth(payable(hacker), 1 ether);
    }

    function test_RevertIf_UnauthorizedTransferERC20() public {
        vm.prank(hacker);
        vm.expectRevert(OnlyAuthorized.selector);
        treasury.transferERC20(address(token), hacker, 100);
    }

    function test_RageQuit_CanTransfer() public {
        uint256 amount = 100 * 10 ** 18;
        
        bool s1 = token.transfer(address(treasury), amount);
        assertTrue(s1, "Funding failed");

        vm.prank(rageQuit);
        treasury.transferERC20(address(token), user, amount);

        assertEq(token.balanceOf(user), 1000 * 10 ** 18 + amount);
    }

    function test_RevertIf_BatchTransfer_LengthMismatch() public {
        address[] memory recipients = new address[](1);
        uint256[] memory amounts = new uint256[](2);

        vm.prank(timelock);
        vm.expectRevert(ArrayLengthMismatch.selector);
        treasury.batchTransferERC20(address(token), recipients, amounts);
    }

    function test_ViewFunctions() public {
        uint256 amount = 500 * 10 ** 18;
        token.transfer(address(treasury), amount);
        
        (bool sent, ) = address(treasury).call{value: 2 ether}("");
        assertTrue(sent);

        assertEq(treasury.tokenBalance(address(token)), amount);
        assertEq(treasury.ethBalance(), 2 ether);
    }

    function test_ZeroAddressChecks() public {
        vm.prank(timelock);
        vm.expectRevert(ZeroAddress.selector);
        treasury.transferEth(payable(address(0)), 1 ether);

        vm.prank(timelock);
        vm.expectRevert(ZeroAddress.selector);
        treasury.transferERC20(address(0), user, 100);
    }

    function test_ZeroAmountChecks() public {
        token.transfer(address(treasury), 300);

        vm.startPrank(timelock);
        
        vm.expectRevert(ZeroAmount.selector);
        treasury.transferEth(payable(user), 0);

        vm.expectRevert(ZeroAmount.selector);
        treasury.transferERC20(address(token), user, 0);

        vm.stopPrank();
    }
}