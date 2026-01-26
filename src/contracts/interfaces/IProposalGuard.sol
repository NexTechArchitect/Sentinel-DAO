// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IProposalGuard {
    function validate(
        address proposer,
        string calldata description
    ) external view returns (bool);

    function recordProposal(address proposer) external;

    function updateReputation(address proposer, bool success) external;
}