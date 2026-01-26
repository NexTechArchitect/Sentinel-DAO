// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

error InsufficientBalance();
error TransferFailed();
error InvalidToken();
error OnlyAuthorized(); // Used for RageQuit + Timelock checks

// --- Rage Quit ---
error ProposalNotExecuted();
error RageQuitWindowExpired();
error AlreadyRageQuit();
error DidNotVoteAgainst();
