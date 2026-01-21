// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

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
    function proposalThreshold() external view returns (uint256); // Added

    function votingDelay() external view returns (uint256);
    function votingPeriod() external view returns (uint256);
    function quorum(uint256 blockNumber) external view returns (uint256); // Added blockNumber param

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
}
