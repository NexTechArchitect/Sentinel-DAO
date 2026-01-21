// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IUpgradeExecutor} from "../interfaces/IUpgradeExecutor.sol";

/**
 * @title Proxy Upgrade Controller
 * @notice A dedicated module for handling protocol upgrades safely.
 * @dev Acts as the administrative interface for UUPS (Universal Upgradeable Proxy Standard) contracts.
 * It separates the "decision to upgrade" (Governance) from the "mechanism of upgrade" (Executor).
 * @custom:security-note Critical component. Only the Timelock (DAO) can invoke functions here.
 * @author NexTechArchitect
 */
contract UpgradeExecutor is IUpgradeExecutor {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error OnlyTimelock();
    error UpgradeFailed();

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The address of the Timelock (The only authorized caller).
    address public immutable timelock;

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the upgrade executor.
     * @param _timelock The Governance Timelock address.
     */
    constructor(address _timelock) {
        timelock = _timelock;
    }

    /*//////////////////////////////////////////////////////////////
                            UPGRADE LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Orchestrates a proxy upgrade.
     * @dev calls `upgradeToAndCall` on the proxy. This is safer than a simple upgrade
     * because it allows us to run migration logic (data initialization) in the same transaction.
     *
     * @param proxy The address of the proxy contract to be upgraded.
     * @param newImplementation The address of the new logic contract.
     * @param data Encoded function call for initialization (migration script).
     */
    function executeUpgrade(
        address proxy,
        address newImplementation,
        bytes calldata data
    ) external onlyTimelock {
        // We use a low-level call to support generic proxies (UUPS/Transparent)
        (bool success, ) = proxy.call(
            abi.encodeWithSignature(
                "upgradeToAndCall(address,bytes)",
                newImplementation,
                data
            )
        );

        if (!success) revert UpgradeFailed();
    }
}
