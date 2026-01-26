// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title GovernanceAnalytics
/// @notice Tracks governance proposal outcomes for analytics

contract GovernanceAnalytics {
  
    event AnalyticsUpdated(uint256 indexed proposalId, bool success);

    error Unauthorized();
    error InvalidAddress();

    address public immutable GOVERNOR;
    address public immutable TOKEN;

    uint256 public successfulProposals;
    uint256 public failedProposals;
    uint256 public totalProposals;

    constructor(address _governor, address _token) {
        if (_governor == address(0) || _token == address(0)) revert InvalidAddress();
        GOVERNOR = _governor;
        TOKEN = _token;
    }

     /* @notice Records proposal outcome
      * @param proposalId The proposal ID
      * @param success Whether the proposal succeeded
     */
    
    function updateAnalytics(uint256 proposalId, bool success) external {
       
        if (msg.sender != GOVERNOR) revert Unauthorized();
        
        totalProposals++;
        
        if (success) {
            successfulProposals++;
        } else {
            failedProposals++;
        }
        
        emit AnalyticsUpdated(proposalId, success);
    }

    function getSuccessRate() external view returns (uint256) {
        if (totalProposals == 0) return 0;
        return (successfulProposals * 10000) / totalProposals;
    }

    function getStats() external view returns (
        uint256 total,
        uint256 successful,
        uint256 failed
    ) {
        return (totalProposals, successfulProposals, failedProposals);
    }
}