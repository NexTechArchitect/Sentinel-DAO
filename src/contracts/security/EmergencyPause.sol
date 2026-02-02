// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IRoleManager} from "../interfaces/IRoleManager.sol";
import {ZeroAddress} from "../errors/CommonErrors.sol";
import {
    OnlyGuardian,
    AlreadyPaused,
    NotPaused
} from "../errors/SecurityErrors.sol";

/**
 * @title Emergency Pause Mechanism
 * @notice Provides a safety breaker that auto-resets after 7 days.
 * @dev Optimized for gas using storage packing (bool + uint40 in one slot).
 */
contract EmergencyPause {
    
    IRoleManager public immutable ROLE_MANAGER;

    
    bool private _paused;
    uint40 public lastPauseTime;
    
    uint40 public constant MAX_PAUSE_DURATION = 7 days;

    event Paused(address indexed guardian, uint256 timestamp);
    event Unpaused(address indexed guardian, uint256 timestamp);

    constructor(address _roleManager) {
        if (_roleManager == address(0)) revert ZeroAddress();
        ROLE_MANAGER = IRoleManager(_roleManager);
    }

    /**
     * @notice Checks if the contract is currently paused.
     * @return bool True if paused and within the 7-day window.
     */
    function isPaused() public view returns (bool) {
        if (_paused) {
           
            if (block.timestamp > uint256(lastPauseTime) + MAX_PAUSE_DURATION) {
                return false; 
            }
            return true;
        }
        return false;
    }

    function _checkGuardian() internal view {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.GUARDIAN_ROLE(), msg.sender)) {
            revert OnlyGuardian();
        }
    }

    function _checkNotPaused() internal view {
        if (isPaused()) revert AlreadyPaused();
    }


    modifier onlyGuardian() {
        _checkGuardian();
        _;
    }

    modifier whenNotPaused() {
        _checkNotPaused();
        _;
    }


    function pause() external onlyGuardian whenNotPaused {
        _paused = true;
        lastPauseTime = uint40(block.timestamp);
        emit Paused(msg.sender, block.timestamp);
    }

    function unpause() external onlyGuardian {
    
        if (!_paused) revert NotPaused();
        
        _paused = false;
        lastPauseTime = 0; 
        
        emit Unpaused(msg.sender, block.timestamp);
    }
}