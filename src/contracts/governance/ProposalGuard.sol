// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IProposalGuard} from "../interfaces/IProposalGuard.sol";

/**
 * @title ProposalGuard
 * @notice Validates proposal content and tracks proposer statistics for the Governor.
 */
contract ProposalGuard is IProposalGuard {

    address public governor;

    mapping(address => uint256) public userProposalCount;
    mapping(address => int256) public externalReputation;


    event ProposalRecorded(address indexed proposer, uint256 count);
    event ReputationUpdated(address indexed proposer, int256 newReputation);


    error Unauthorized();
    error InvalidAddress();


    constructor(address _governor) {
        if (_governor == address(0)) revert InvalidAddress();

        governor = _governor;
    }


    /**
     * @notice Performs content validation on the proposal description.
     * @dev Checks for minimum length and repeated character spam (e.g., "aaaaa").
     * @param description The full text of the proposal.
     * @return bool True if the proposal passes validation.
     */
    function validate(address , string calldata description) external pure override returns (bool) {
        
        bytes memory descBytes = bytes(description);
        
        if (descBytes.length <= 5) return false;


        if (descBytes.length > 0) {
            bool allSame = true;
            bytes1 firstChar = descBytes[0];
            
            uint256 checkLen = descBytes.length < 10 ? descBytes.length : 10;
            
            for (uint256 i = 1; i < checkLen; i++) {
                if (descBytes[i] != firstChar) {
                    allSame = false;
                    break;
                }
            }

            if (allSame) return false;
        }

        return true;
    }


    /**
     * @notice Records the proposal event and increments user stats.
     * @param proposer The address of the account creating the proposal.
     */
    function recordProposal(address proposer) external override {
        if (msg.sender != governor) revert Unauthorized();
        
        userProposalCount[proposer]++;

        emit ProposalRecorded(proposer, userProposalCount[proposer]);
    }


    /**
     * @notice Updates the proposer's reputation based on proposal outcomes.
     * @param proposer The address of the proposer.
     * @param positive Whether the outcome was favorable.
     */
    function updateReputation(address proposer, bool positive) external override {
        if (msg.sender != governor) revert Unauthorized();
        
        if (positive) {
            externalReputation[proposer] += 10;
        } else {
            externalReputation[proposer] -= 5;
        }
        
        emit ReputationUpdated(proposer, externalReputation[proposer]);
    }
}