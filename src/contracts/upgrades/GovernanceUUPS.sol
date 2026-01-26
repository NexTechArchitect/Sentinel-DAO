// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Governance UUPS Base
 * @notice Abstract base for UUPS proxies ensuring upgrades are authorized.
 */
abstract contract GovernanceUUPS is UUPSUpgradeable {
    error Unauthorized();

    /**
     * @dev Authorization check for UUPS upgrades.
     * Reverts if caller is not the authorized upgrade authority.
     */
    function _authorizeUpgrade(address ) internal view override {
        if (msg.sender != _getUpgradeAuthority()) {
            revert Unauthorized();
        }
    }

    /**
     * @dev Returns the address allowed to upgrade this contract (e.g., Timelock).
     */
    function _getUpgradeAuthority() internal view virtual returns (address);
}