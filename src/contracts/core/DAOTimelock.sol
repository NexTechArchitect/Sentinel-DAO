// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DAOTimelock
 * @notice A time-delay enforcer for DAO governance proposals.
 * @dev Extends OpenZeppelin's TimelockController with strict validation for initial roles and delays.
 */
contract DAOTimelock is TimelockController {
    error InvalidMinDelay(uint256 provided, uint256 min, uint256 max);
    error EmptyProposers();
    error EmptyExecutors();
    error ZeroAddressInArray();

    event TimelockDeployed(uint256 minDelay, address[] proposers, address[] executors);

    uint256 public constant MIN_DELAY_LIMIT = 0; 
    uint256 public constant MAX_DELAY_LIMIT = 30 days;

    /**
     * @notice Initializes the Timelock with specific delay limits and role assignments.
     * @param minDelay The minimum time (in seconds) that must pass before a proposal is executed.
     * @param proposers List of addresses allowed to submit proposals.
     * @param executors List of addresses allowed to execute successful proposals.
     * @param admin Address to be granted the admin role (set to address(0) for DAO self-governance).
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        
        if (minDelay < MIN_DELAY_LIMIT || minDelay > MAX_DELAY_LIMIT) {
            revert InvalidMinDelay(minDelay, MIN_DELAY_LIMIT, MAX_DELAY_LIMIT);
        }
        if (proposers.length == 0) revert EmptyProposers();
        if (executors.length == 0) revert EmptyExecutors();
        
        for (uint256 i = 0; i < proposers.length; ) {
            if (proposers[i] == address(0)) revert ZeroAddressInArray();
            unchecked { ++i; }
        }
        for (uint256 i = 0; i < executors.length; ) {
            if (executors[i] == address(0)) revert ZeroAddressInArray();
            unchecked { ++i; }
        }
        
        emit TimelockDeployed(minDelay, proposers, executors);
    }
}