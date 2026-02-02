// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {RoleManager} from "../security/RoleManager.sol";
import {ZeroAddress, Unauthorized} from "../errors/CommonErrors.sol";

/**
 * @title TreasuryYieldStrategy
 * @author Turtur (FOUNDRY-DAO-F25)
 * @notice Connects the DAO Treasury to Aave V3 to generate yield on idle assets.
 * @dev Specifically integrated with Aave V3 Pool on Sepolia: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
 */
contract TreasuryYieldStrategy {
    using SafeERC20 for IERC20;

    IPool public immutable AAVE_POOL;
    RoleManager public immutable ROLE_MANAGER;
    address public immutable TREASURY;

    event FundsDeposited(address indexed asset, uint256 amount);
    event FundsWithdrawn(address indexed asset, uint256 amount);

    error DepositFailed();
    error WithdrawFailed();


    modifier onlyTreasury() {
        _checkTreasury();
        _;
    }


    function _checkTreasury() internal view {
        if (msg.sender != TREASURY) revert Unauthorized();
    }


    /**
     * @param _aavePool Address of the Aave V3 Lending Pool
     * @param _roleManager Address of the DAO RoleManager for security checks
     * @param _treasury Address of the DAO Treasury vault
     */
    constructor(address _aavePool, address _roleManager, address _treasury) {
        if (_aavePool == address(0)) revert ZeroAddress();
        if (_roleManager == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        AAVE_POOL = IPool(_aavePool);
        ROLE_MANAGER = RoleManager(_roleManager);
        TREASURY = _treasury;
    }


    /**
     * @notice Supplies assets from the Treasury to the Aave Pool.
     */
    function depositToAave(address asset, uint256 amount) external onlyTreasury {
        
        IERC20(asset).forceApprove(address(AAVE_POOL), amount);

        try AAVE_POOL.supply(asset, amount, TREASURY, 0) {
            emit FundsDeposited(asset, amount);
        } catch {
            revert DepositFailed();
        }
    }


    /**
     * @notice Withdraws assets from Aave and sends them to a designated receiver.
     */
    function withdrawFromAave(
        address asset, 
        uint256 amount, 
        address receiver
    ) external onlyTreasury {
        try AAVE_POOL.withdraw(asset, amount, receiver) {
            emit FundsWithdrawn(asset, amount);
        } catch {
            revert WithdrawFailed();
        }
    }


    /**
     * @notice Emergency function to recover stuck tokens in the strategy contract.
     * @dev Only callable by the DAO Admin.
     */
    function emergencyWithdraw(address asset) external {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender))
            revert Unauthorized();
            
        uint256 balance = IERC20(asset).balanceOf(address(this));
        if (balance > 0) {
            IERC20(asset).safeTransfer(TREASURY, balance);
        }
    }
}