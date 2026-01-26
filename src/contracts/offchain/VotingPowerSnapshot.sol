// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ZeroAddress} from "../errors/CommonErrors.sol";
import {Unauthorized} from "../errors/GovernanceErrors.sol";

/**
 * @title Voting Power Snapshot
 * @notice Emits a distinct event to signal off-chain indexers to snapshot voting power.
 * @dev Restricted to Governor and Timelock to ensure signal integrity.
 * @author NexTechArchitect
 */
contract VotingPowerSnapshot {
    address public immutable GOVERNOR;
    address public immutable TIMELOCK;

    event SnapshotTaken(uint256 indexed proposalId, uint256 timestamp);

    constructor(address _governor, address _timelock) {
        if (_governor == address(0) || _timelock == address(0)) {
            revert ZeroAddress();
        }
        GOVERNOR = _governor;
        TIMELOCK = _timelock;
    }

    /**
     * @notice Emits the snapshot signal.
     * @param proposalId The ID of the proposal triggering the snapshot.
     */
    function createSnapshot(uint256 proposalId) external {
        
        if (msg.sender != GOVERNOR && msg.sender != TIMELOCK) {
            revert Unauthorized();
        }

        emit SnapshotTaken(proposalId, block.timestamp);
    }
}