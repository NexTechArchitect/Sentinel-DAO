// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {VotingStrategies} from "../governance/VotingStrategies.sol";

/**
 * @title IGovernor (Advanced)
 * @notice Interface for the Hybrid Governor with Strategy support.
 */
interface IGovernor {
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Executed
    }

    // --- Events ---
    event VotingStrategyUpdated(
        VotingStrategies.Strategy oldStrategy,
        VotingStrategies.Strategy newStrategy
    );
    event TokenAcquisitionRecorded(address indexed account, uint256 timestamp);

    function state(uint256 proposalId) external view returns (ProposalState);
    function proposalSnapshot(
        uint256 proposalId
    ) external view returns (uint256);
    function proposalDeadline(
        uint256 proposalId
    ) external view returns (uint256);
    function proposalProposer(
        uint256 proposalId
    ) external view returns (address);
    function proposalThreshold() external view returns (uint256);

    function votingDelay() external view returns (uint256);
    function votingPeriod() external view returns (uint256);
    function quorum(uint256 blockNumber) external view returns (uint256);

    function updateVotingStrategy(
        VotingStrategies.Strategy newStrategy
    ) external;
    function getCurrentStrategyName() external view returns (string memory);
    function currentStrategy()
        external
        view
        returns (VotingStrategies.Strategy);
    function recordTokenAcquisition(address account) external;
    function updateQuorumNumerator(uint256 newQuorumNumerator) external;

    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external returns (uint256);

    function castVote(
        uint256 proposalId,
        uint8 support
    ) external returns (uint256);

    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external returns (uint256);

    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256);

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256);

    function cancel(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 descriptionHash
    ) external returns (uint256);

    function timelock() external view returns (address);
}
