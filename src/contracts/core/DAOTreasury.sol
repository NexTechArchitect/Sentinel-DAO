// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {
    IERC721Receiver
} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {
    IERC1155Receiver
} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

import {
    OnlyTimelock,
    InvalidAddress,
    ZeroAmount,
    LengthMismatch
} from "../errors/TreasuryErrors.sol";

/**
 * @title DAO Treasury Vault
 * @notice The secure asset holding contract for the DAO.
 * @dev This contract acts as a multisig vault that holds ETH, ERC20, ERC721, and ERC1155 assets.
 * It is completely passive and has no logic to spend funds on its own.
 * @custom:security-note Funds can ONLY be withdrawn via the Timelock controller (Governance).
 * @author NexTechArchitect
 */
contract DAOTreasury is IERC721Receiver, IERC1155Receiver {
    using Address for address payable;
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The address of the Timelock contract (The only authorized spender).
    address public immutable TIMELOCK;

    /*//////////////////////////////////////////////////////////////
                                 MODIFIER
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Restricts function execution to the Timelock contract.
     * @dev Used on all asset withdrawal functions.
     */
    modifier onlyTimelock() {
        if (msg.sender != TIMELOCK) revert OnlyTimelock();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the Treasury with its owner.
     * @param timelock The address of the governance Timelock.
     */
    constructor(address timelock) {
        if (timelock == address(0)) revert InvalidAddress();
        TIMELOCK = timelock;
    }

    /*//////////////////////////////////////////////////////////////
                                RECEIVE ETH
    //////////////////////////////////////////////////////////////*/

    /// @notice Allows the contract to receive plain ETH transfers.
    receive() external payable {}

    /// @notice Explicit function to deposit ETH (for UI clarity).
    function depositETH() external payable {}

    /*//////////////////////////////////////////////////////////////
                               ERC20 DEPOSIT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits ERC20 tokens into the treasury.
     * @dev Requires approval from the sender before calling.
     * @param token The address of the ERC20 token.
     * @param amount The amount to deposit.
     */
    function depositERC20(address token, uint256 amount) external {
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /*//////////////////////////////////////////////////////////////
                               ERC721 DEPOSIT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits a specific NFT into the treasury.
     * @param token The NFT contract address.
     * @param tokenId The ID of the NFT to deposit.
     */
    function depositERC721(address token, uint256 tokenId) external {
        if (token == address(0)) revert InvalidAddress();

        IERC721(token).safeTransferFrom(msg.sender, address(this), tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                              ERC1155 DEPOSIT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits ERC1155 (Semi-Fungible) tokens.
     * @param token The contract address.
     * @param id The token ID type.
     * @param amount The quantity to deposit.
     * @param data Additional data for the transfer hook.
     */
    function depositERC1155(
        address token,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external {
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        IERC1155(token).safeTransferFrom(
            msg.sender,
            address(this),
            id,
            amount,
            data
        );
    }

    /*//////////////////////////////////////////////////////////////
                                ETH WITHDRAW
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws ETH from the treasury.
     * @dev Only callable via Governance vote (Timelock).
     * @param to The recipient address.
     * @param amount The amount of Wei to send.
     */
    function transferETH(
        address payable to,
        uint256 amount
    ) external onlyTimelock {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        to.sendValue(amount);
    }

    /*//////////////////////////////////////////////////////////////
                               ERC20 WITHDRAW
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws ERC20 tokens.
     * @dev Only callable via Governance vote (Timelock).
     * @param token The token contract address.
     * @param to The recipient address.
     * @param amount The amount to transfer.
     */
    function transferERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyTimelock {
        if (token == address(0) || to == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Bulk transfers ERC20 tokens to multiple recipients.
     * @dev Useful for payroll, grants, or airdrops to save gas.
     * @param token The token contract address.
     * @param recipients Array of recipient addresses.
     * @param amounts Array of amounts matching the recipients.
     */
    function batchTransferERC20(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyTimelock {
        if (recipients.length != amounts.length) revert LengthMismatch();

        for (uint256 i; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (amounts[i] == 0) revert ZeroAmount();

            IERC20(token).safeTransfer(recipients[i], amounts[i]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                               ERC721 WITHDRAW
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws an NFT.
     * @dev Only callable via Governance vote (Timelock).
     * @param token The NFT contract address.
     * @param to The recipient address.
     * @param tokenId The ID of the NFT.
     */
    function transferERC721(
        address token,
        address to,
        uint256 tokenId
    ) external onlyTimelock {
        if (token == address(0) || to == address(0)) revert InvalidAddress();

        IERC721(token).safeTransferFrom(address(this), to, tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                              ERC1155 WITHDRAW
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws ERC1155 tokens.
     * @dev Only callable via Governance vote (Timelock).
     * @param token The contract address.
     * @param to The recipient address.
     * @param id The token ID.
     * @param amount The quantity to transfer.
     * @param data Additional data.
     */
    function transferERC1155(
        address token,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external onlyTimelock {
        if (token == address(0) || to == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        IERC1155(token).safeTransferFrom(address(this), to, id, amount, data);
    }

    /*//////////////////////////////////////////////////////////////
                            ERC721 RECEIVER
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Handles the receipt of an ERC721 token.
     * @dev Required to ensure the contract can safely hold NFTs.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /*//////////////////////////////////////////////////////////////
                            ERC1155 RECEIVER
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Handles the receipt of a single ERC1155 token type.
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @notice Handles the receipt of multiple ERC1155 token types.
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @notice Checks if the contract supports required interfaces.
     * @dev Used by marketplaces and wallets to verify receiver capability.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId;
    }

    /*//////////////////////////////////////////////////////////////
                                  VIEW
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the ETH balance of the treasury.
     */
    function ethBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns the balance of a specific ERC20 token.
     * @param token The ERC20 token address.
     */
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}