// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title GovernanceUUPS
 * @notice UUPS upgrade logic controlled strictly by DAO Timelock
 * @dev Upgrade authority flows: Governor → Timelock → UUPS
 * @author NEXTECHARHITECT
 */

import {
    UUPSUpgradeable
} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract GovernanceUUPS is Initializable, UUPSUpgradeable {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error OnlyTimelock();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    address public timelock;

    /*//////////////////////////////////////////////////////////////
                             INITIALIZER
    //////////////////////////////////////////////////////////////*/

    function initialize(address _timelock) external initializer {
        if (_timelock == address(0)) revert ZeroAddress();
        timelock = _timelock;
    }

    /*//////////////////////////////////////////////////////////////
                          UUPS AUTHORIZATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Called during upgrade.
     * Upgrade can ONLY be executed via DAO Timelock.
     */
    function _authorizeUpgrade(address) internal view override {
        if (msg.sender != timelock) revert OnlyTimelock();
    }
}
