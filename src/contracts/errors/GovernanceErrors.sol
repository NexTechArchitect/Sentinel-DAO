// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

error OnlyTimelock();
error ModuleAlreadyExists();
error ModuleNotFound();
error SameAddress();
error AlreadyLocked();
// --- Governor & Voting ---
error InvalidProposalId();
error ProposalNotActive();
error VotingNotStarted();
error VotingEnded();
error InvalidSupport(); 
error AlreadyVoted();

// --- Governance Token ---
error NotGovernance();
error MaxSupplyExceeded();

// --- Strategies & Snapshots ---
error InvalidStrategy();
error SameStrategy();
error SnapshotAlreadyExists(uint256 proposalId);
error SnapshotNotFound(uint256 proposalId);

// --- Offchain Execution ---
error ResultAlreadyExecuted();
error InvalidSignature();
error SignatureExpired();
error Unauthorized();
  
  // --- Timelock ---
 error InvalidMinDelay(uint256 provided, uint256 min, uint256 max);
    error EmptyProposers();
    error EmptyExecutors();
    error ZeroAddressInArray();
    error AdminMustBeZero();
