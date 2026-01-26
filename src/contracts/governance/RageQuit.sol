// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITreasury} from "../interfaces/ITreasury.sol";
import {ZeroAddress, ZeroAmount} from "../errors/CommonErrors.sol";

interface IBurnable {
    function burnFrom(address account, uint256 amount) external;
}

/**
 * @title RageQuit
 * @notice Allows users to exit the DAO by burning their governance tokens in exchange for 
 * a proportional share of the Treasury's assets.
 */
contract RageQuit is ReentrancyGuard {
    using SafeERC20 for IERC20;


    address public immutable GOVERNANCE_TOKEN;
    address public immutable TREASURY;
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;


    mapping(address => bool) public hasRageQuit;


    event RageQuitExecuted(address indexed user, address[] assets, uint256 burnedAmount);


    error AlreadyRageQuit();


    constructor(address _token, address _treasury) {
        if (_token == address(0) || _treasury == address(0)) revert ZeroAddress();

        GOVERNANCE_TOKEN = _token;
        TREASURY = _treasury;
    }


    /**
     * @notice Burns user tokens and transfers their proportional share of treasury assets.
     * @dev Share calculation: (userTokens * treasuryAssetBalance) / totalCirculatingSupply.
     * @param assets List of asset addresses (ERC20s or address(0) for ETH) to withdraw.
     * @param amount The amount of Governance tokens the user is burning to exit.
     */
    function quit(address[] calldata assets, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (hasRageQuit[msg.sender]) revert AlreadyRageQuit();

        hasRageQuit[msg.sender] = true;


        // Calculate adjusted supply (Total Supply - Burned/Dead tokens)
        uint256 supply = IERC20(GOVERNANCE_TOKEN).totalSupply();
        uint256 deadBalance = IERC20(GOVERNANCE_TOKEN).balanceOf(DEAD);
        
        unchecked {
            supply -= deadBalance;
        }


        // Burn tokens or send to Dead address
        try IBurnable(GOVERNANCE_TOKEN).burnFrom(msg.sender, amount) {} catch {
            IERC20(GOVERNANCE_TOKEN).safeTransferFrom(msg.sender, DEAD, amount);
        }


        // Proportional Asset Distribution
        uint256 len = assets.length;
        for (uint256 i = 0; i < len; ) {
            address asset = assets[i];
            uint256 treasuryBalance = (asset == address(0)) 
                ? address(TREASURY).balance 
                : IERC20(asset).balanceOf(TREASURY);

            uint256 share;
            unchecked {
                share = (amount * treasuryBalance) / supply;
            }

            if (share > 0) {
                if (asset == address(0)) {
                    ITreasury(TREASURY).transferEth(payable(msg.sender), share);
                } else {
                    ITreasury(TREASURY).transferERC20(asset, msg.sender, share);
                }
            }

            unchecked { ++i; }
        }

        emit RageQuitExecuted(msg.sender, assets, amount);
    }
}