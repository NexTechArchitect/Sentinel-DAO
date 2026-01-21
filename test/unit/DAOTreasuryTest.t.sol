// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";

// 1. Import the standard implementations instead of mocks
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// 2. Define your own Mocks inheriting from the standards
contract ERC20Mock is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract ERC721Mock is ERC721 {
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}

contract ERC1155Mock is ERC1155 {
    constructor(string memory uri) ERC1155(uri) {}

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        _mint(to, id, amount, data);
    }
}

contract DAOTreasuryTest is Test {
    DAOTreasury treasury;

    ERC20Mock erc20;
    ERC721Mock erc721;
    ERC1155Mock erc1155;

    address timelock = address(100);
    address user = address(200);

    // Arrays declared as state variables to fix the "undeclared identifier" error in batch test
    address[] recipients = new address[](2);
    uint256[] amounts = new uint256[](2);

    function setUp() public {
        treasury = new DAOTreasury(timelock);

        // Deploy the local mocks
        erc20 = new ERC20Mock("MockToken", "MTK", user, 1_000_000 ether);
        erc721 = new ERC721Mock("MockNFT", "MNFT");
        erc1155 = new ERC1155Mock("");

        vm.deal(user, 100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                                ETH
    //////////////////////////////////////////////////////////////*/

    function test_depositETH() public {
        vm.prank(user);
        treasury.depositETH{value: 10 ether}();

        assertEq(address(treasury).balance, 10 ether);
    }

    function test_transferETH_onlyTimelock() public {
        vm.prank(user);
        treasury.depositETH{value: 5 ether}();

        vm.prank(timelock);
        treasury.transferETH(payable(user), 5 ether);

        assertEq(user.balance, 100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                                ERC20
    //////////////////////////////////////////////////////////////*/

    function test_depositERC20() public {
        vm.startPrank(user);
        erc20.approve(address(treasury), 100 ether);
        treasury.depositERC20(address(erc20), 100 ether);
        vm.stopPrank();

        assertEq(erc20.balanceOf(address(treasury)), 100 ether);
    }

    function test_transferERC20() public {
        vm.startPrank(user);
        erc20.approve(address(treasury), 200 ether);
        treasury.depositERC20(address(erc20), 200 ether);
        vm.stopPrank();

        vm.prank(timelock);
        treasury.transferERC20(address(erc20), user, 50 ether);

        assertEq(erc20.balanceOf(user), 1_000_000 ether - 200 ether + 50 ether);
    }

    function test_batchTransferERC20() public {
        vm.startPrank(user);
        erc20.approve(address(treasury), 300 ether);
        treasury.depositERC20(address(erc20), 300 ether);
        vm.stopPrank();

        // Setup arrays
        recipients[0] = address(1);
        recipients[1] = address(2);

        amounts[0] = 100 ether;
        amounts[1] = 200 ether;

        vm.prank(timelock);
        treasury.batchTransferERC20(address(erc20), recipients, amounts);

        assertEq(erc20.balanceOf(address(1)), 100 ether);
        assertEq(erc20.balanceOf(address(2)), 200 ether);
    }

    /*//////////////////////////////////////////////////////////////
                                ERC721
    //////////////////////////////////////////////////////////////*/

    function test_depositERC721() public {
        erc721.mint(user, 1);

        vm.startPrank(user);
        erc721.approve(address(treasury), 1);
        treasury.depositERC721(address(erc721), 1);
        vm.stopPrank();

        assertEq(erc721.ownerOf(1), address(treasury));
    }

    function test_transferERC721() public {
        erc721.mint(user, 2);

        vm.startPrank(user);
        erc721.approve(address(treasury), 2);
        treasury.depositERC721(address(erc721), 2);
        vm.stopPrank();

        vm.prank(timelock);
        treasury.transferERC721(address(erc721), user, 2);

        assertEq(erc721.ownerOf(2), user);
    }

    /*//////////////////////////////////////////////////////////////
                                ERC1155
    //////////////////////////////////////////////////////////////*/

    function test_depositERC1155() public {
        erc1155.mint(user, 1, 10, "");

        vm.startPrank(user);
        erc1155.setApprovalForAll(address(treasury), true);
        treasury.depositERC1155(address(erc1155), 1, 10, "");
        vm.stopPrank();

        assertEq(erc1155.balanceOf(address(treasury), 1), 10);
    }

    function test_transferERC1155() public {
        erc1155.mint(user, 2, 20, "");

        vm.startPrank(user);
        erc1155.setApprovalForAll(address(treasury), true);
        treasury.depositERC1155(address(erc1155), 2, 20, "");
        vm.stopPrank();

        vm.prank(timelock);
        treasury.transferERC1155(address(erc1155), user, 2, 5, "");

        assertEq(erc1155.balanceOf(user, 2), 5);
    }
}
