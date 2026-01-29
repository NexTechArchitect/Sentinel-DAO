// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

////////////////////////////////////////////////
//              GovernorErrors                //
////////////////////////////////////////////////

error OnlyTimelock();
error ModuleAlreadyExists();
error ModuleNotFound();
error SameAddress();
error AlreadyLocked();


error InvalidProposalId();
error ProposalNotActive();
error VotingNotStarted();
error VotingEnded();
error InvalidSupport(); 
error AlreadyVoted();

error NotGovernance();
error MaxSupplyExceeded();

error InvalidStrategy();
error SameStrategy();
error SnapshotAlreadyExists(uint256 proposalId);
error SnapshotNotFound(uint256 proposalId);

error ResultAlreadyExecuted();
error InvalidSignature();
error SignatureExpired();
error Unauthorized();
  

 error InvalidMinDelay(uint256 provided, uint256 min, uint256 max);
    error EmptyProposers();
    error EmptyExecutors();
    error ZeroAddressInArray();
    error AdminMustBeZero();
