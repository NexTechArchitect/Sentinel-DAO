// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IGovernanceAnalytics {
    /**
     * @notice Updates the analytics stats for a finished proposal.
     * @param proposalId The ID of the proposal.
     * @param success True if executed, false if defeated/canceled.
     */
    function updateAnalytics(uint256 proposalId, bool success) external;
}