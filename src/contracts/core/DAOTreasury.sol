// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITreasury} from "../interfaces/ITreasury.sol";
import {ZeroAddress, ZeroAmount, ArrayLengthMismatch} from "../errors/CommonErrors.sol";
import {OnlyTimelock} from "../errors/GovernanceErrors.sol";
import {OnlyAuthorized} from "../errors/TreasuryErrors.sol";

/**
 * @title DAOTreasury
 * @author Turtur (FOUNDRY-DAO-F25)
 * @notice Multi-asset vault for DAO funds supporting Governance and Emergency exits.
 */
contract DAOTreasury is
    ITreasury,
    ReentrancyGuard,
    IERC721Receiver,
    IERC1155Receiver
{
    using Address for address payable;
    using SafeERC20 for IERC20;

    address public immutable TIMELOCK;
    address public rageQuitContract;


    modifier onlyAuthorized() {
        _checkAuthorized();
        _;
    }


    function _checkAuthorized() internal view {
        if (msg.sender != TIMELOCK && msg.sender != rageQuitContract) {
            revert OnlyAuthorized();
        }
    }


    modifier onlyTimelock() {
        _checkTimelock();
        _;
    }


    function _checkTimelock() internal view {
        if (msg.sender != TIMELOCK) revert OnlyTimelock();
    }


    constructor(address timelock) {
        if (timelock == address(0)) revert ZeroAddress();
        TIMELOCK = timelock;
    }


    function setRageQuitContract(address _rageQuit) external onlyTimelock {
        if (_rageQuit == address(0)) revert ZeroAddress();
        rageQuitContract = _rageQuit;
        emit RageQuitContractSet(_rageQuit);
    }


    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }


    function depositEth() external payable override {
        emit FundsReceived(msg.sender, msg.value);
    }


    function depositERC20(address token, uint256 amount) external override {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }


    function depositERC721(address token, uint256 tokenId) external override {
        if (token == address(0)) revert ZeroAddress();
        IERC721(token).safeTransferFrom(msg.sender, address(this), tokenId);
    }


    function depositERC1155(
        address token,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external override {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC1155(token).safeTransferFrom(msg.sender, address(this), id, amount, data);
    }


    function transferEth(
        address payable to,
        uint256 amount
    ) external override nonReentrant onlyAuthorized {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        emit FundsSent(to, amount);
        to.sendValue(amount);
    }


    function transferERC20(
        address token,
        address to,
        uint256 amount
    ) external override nonReentrant onlyAuthorized {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        emit FundsSent(to, amount);
        IERC20(token).safeTransfer(to, amount);
    }


    function batchTransferERC20(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external override onlyTimelock nonReentrant {
        if (recipients.length != amounts.length) revert ArrayLengthMismatch();

        uint256 len = recipients.length;
        for (uint256 i; i < len; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();

            IERC20(token).safeTransfer(recipients[i], amounts[i]);
            unchecked { ++i; }
        }
    }


    function transferERC721(address token, address to, uint256 tokenId) external override onlyTimelock {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        IERC721(token).safeTransferFrom(address(this), to, tokenId);
    }


    function transferERC1155(
        address token,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external override onlyTimelock {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC1155(token).safeTransferFrom(address(this), to, id, amount, data);
    }


    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }


    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }


    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }


    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || interfaceId == type(IERC1155Receiver).interfaceId;
    }


    function ethBalance() external view override returns (uint256) {
        return address(this).balance;
    }


    function tokenBalance(address token) external view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}