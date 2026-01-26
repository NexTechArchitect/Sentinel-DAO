// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {RoleManager} from "../security/RoleManager.sol";
import {Unauthorized, ZeroAddress, ArrayLengthMismatch} from "../errors/CommonErrors.sol";

/**
 * @title Upgrade Executor
 * @notice Centralized handler for performing UUPS upgrades via the DAO.
 * @dev Handles atomic upgrades and batch processing.
 */
contract UpgradeExecutor {
    RoleManager public immutable ROLE_MANAGER;

    event UpgradeExecuted(address indexed proxy, address indexed newImplementation);
    error UpgradeFailed();

    constructor(address _roleManager) {
        if (_roleManager == address(0)) revert ZeroAddress();
        ROLE_MANAGER = RoleManager(_roleManager);
    }

    /**
     * @notice Executes a single upgrade on a proxy.
     */
    function executeUpgrade(
        address proxy,
        address newImplementation,
        bytes calldata data
    ) external payable {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender))
            revert Unauthorized();
        
        if (proxy == address(0) || newImplementation == address(0))
            revert ZeroAddress();

        bytes memory callData;
        if (data.length > 0) {
            callData = abi.encodeWithSignature("upgradeToAndCall(address,bytes)", newImplementation, data);
        } else {
            callData = abi.encodeWithSignature("upgradeTo(address)", newImplementation);
        }

        (bool success, ) = proxy.call{value: msg.value}(callData);
        if (!success) revert UpgradeFailed();

        emit UpgradeExecuted(proxy, newImplementation);
    }

    /**
     * @notice Batch upgrades for multiple contracts in one transaction.
     * @dev Fixed: Added array length validation.
     */
    function executeBatchUpgrade(
        address[] calldata proxies,
        address[] calldata implementations,
        bytes[] calldata datas
    ) external {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender))
            revert Unauthorized();

        uint256 len = proxies.length;
        if (len != implementations.length || len != datas.length) 
            revert ArrayLengthMismatch();

        for (uint256 i = 0; i < len; ) {
            bytes memory callData = datas[i].length > 0
                ? abi.encodeWithSignature("upgradeToAndCall(address,bytes)", implementations[i], datas[i])
                : abi.encodeWithSignature("upgradeTo(address)", implementations[i]);

            (bool success, ) = proxies[i].call(callData);
            if (!success) revert UpgradeFailed();

            emit UpgradeExecuted(proxies[i], implementations[i]);

            unchecked { ++i; }
        }
    }
}