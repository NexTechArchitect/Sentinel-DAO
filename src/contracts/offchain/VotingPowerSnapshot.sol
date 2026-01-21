// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @title Voting Power Snapshot Registry
 * @notice A helper oracle that "freezes" the voting power of the DAO at specific block heights.
 * @dev This contract acts as the on-chain source of truth for off-chain voting systems (like Snapshot.org).
 * It ensures that gasless signatures correspond to the user's actual token balance at the exact moment
 * a proposal was created, preventing double-voting or voting with transferred tokens.
 * @author NexTechArchitect
 */
contract VotingPowerSnapshot {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when initializing with an invalid token address.
    error ZeroAddress();

    /// @notice Thrown when attempting to snapshot an ID 0 (reserved).
    error InvalidProposalId();

    /// @notice Thrown to prevent resetting the snapshot block (Security critical).
    error SnapshotAlreadyExists(uint256 proposalId);

    /// @notice Thrown when querying a proposal that has not been initialized.
    error SnapshotNotFound(uint256 proposalId);

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new proposal's voting power is checkpointed.
    event SnapshotCreated(uint256 indexed proposalId, uint256 snapshotBlock);

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The governance token contract (must support ERC20Votes).
    IVotes public immutable governanceToken;

    /// @dev Mapping from Proposal ID => Block Number where power was frozen.
    mapping(uint256 => uint256) private _snapshotBlocks;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the snapshot registry.
     * @param token The address of the DAO's governance token.
     */
    constructor(address token) {
        if (token == address(0)) {
            revert ZeroAddress();
        }
        governanceToken = IVotes(token);
    }

    /*//////////////////////////////////////////////////////////////
                               SNAPSHOT LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checkpoints the current block height for a specific proposal.
     * @dev We record `block.number - 1` to prevent Flash Loan attacks.
     * If we used the current block, an attacker could borrow tokens, vote, and repay
     * all in the same transaction. Using the past block forces legitimate ownership.
     * @param proposalId The unique ID of the proposal to lock.
     */
    function createSnapshot(uint256 proposalId) external {
        if (proposalId == 0) revert InvalidProposalId();

        if (_snapshotBlocks[proposalId] != 0) {
            revert SnapshotAlreadyExists(proposalId);
        }

        // Security: Use previous block to mitigate flash loans
        uint256 snapshot = block.number - 1;
        _snapshotBlocks[proposalId] = snapshot;

        emit SnapshotCreated(proposalId, snapshot);
    }

    /*//////////////////////////////////////////////////////////////
                               VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Queries the historical voting power of a user for a specific proposal.
     * @dev Used to validate off-chain signatures.
     * @param proposalId The proposal ID to check against.
     * @param account The user address.
     * @return The number of votes the user held at the snapshot block.
     */
    function votePowerAt(
        uint256 proposalId,
        address account
    ) external view returns (uint256) {
        uint256 snapshot = _snapshotBlocks[proposalId];

        if (snapshot == 0) {
            revert SnapshotNotFound(proposalId);
        }

        return governanceToken.getPastVotes(account, snapshot);
    }

    /**
     * @notice Queries the total supply of voting tokens at the snapshot block.
     * @dev Essential for calculating Quorum percentages correctly.
     * @param proposalId The proposal ID.
     * @return The total supply of votes at that historical moment.
     */
    function totalSupplyAt(uint256 proposalId) external view returns (uint256) {
        uint256 snapshot = _snapshotBlocks[proposalId];

        if (snapshot == 0) {
            revert SnapshotNotFound(proposalId);
        }

        return governanceToken.getPastTotalSupply(snapshot);
    }

    /**
     * @notice Returns the specific block number used for a proposal's snapshot.
     */
    function snapshotBlock(uint256 proposalId) external view returns (uint256) {
        return _snapshotBlocks[proposalId];
    }
}
