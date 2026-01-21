// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {RoleManager} from "./RoleManager.sol";
import {
    OnlyGuardian,
    AlreadyPaused,
    NotPaused
} from "../errors/SecurityErrors.sol";

/**
 * @title Emergency Circuit Breaker
 * @notice A high-speed security module designed to halt protocol operations during a crisis.
 * @dev This contract acts as an override switch. While Governance is slow (1-week delay),
 * this contract allows a trusted 'Guardian' committee to pause sensitive actions instantly.
 *
 * @custom:security-note This decoupling of "Day-to-Day Governance" vs "Emergency Response"
 * is a best practice for immutable protocols.
 * @author NexTechArchitect
 */
contract EmergencyPause {
    /*////////////////////////////////////////////////////////
                        STATE VARIABLES
    ////////////////////////////////////////////////////////*/

    RoleManager public immutable roleManager;
    bool public paused;

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    /*////////////////////////////////////////////////////////
                           MODIFIERS
    ////////////////////////////////////////////////////////*/

    /**
     * @dev Restricts access to the Guardian Role (Security Council).
     */
    modifier onlyGuardian() {
        if (!roleManager.hasRole(GUARDIAN_ROLE, msg.sender))
            revert OnlyGuardian();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert AlreadyPaused();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert NotPaused();
        _;
    }

    /*////////////////////////////////////////////////////////
                            EVENTS
    ////////////////////////////////////////////////////////*/
    event Paused(address indexed guardian);
    event Unpaused(address indexed guardian);

    /*////////////////////////////////////////////////////////
                          CONSTRUCTOR
    ////////////////////////////////////////////////////////*/

    /**
     * @notice Connects the circuit breaker to the central access control system.
     * @param _roleManager The address of the RoleManager contract.
     */
    constructor(address _roleManager) {
        roleManager = RoleManager(_roleManager);
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY ACTIONS
    ////////////////////////////////////////////////////////////*/

    /**
     * @notice ACTIVATES the emergency state.
     * @dev Callable only by the Guardian. Instantly sets `paused` to true.
     * Any contract depending on this flag (like the Treasury) will stop processing transactions.
     */
    function pause() external onlyGuardian whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice DEACTIVATES the emergency state.
     * @dev Restores normal protocol operations after the threat has been resolved.
     */
    function unpause() external onlyGuardian whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
