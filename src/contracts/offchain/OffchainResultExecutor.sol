// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {SignatureVerifier} from "../utils/SignatureVerifier.sol";

/**
 * @title Off-Chain Result Executor (Oracle Bridge)
 * @notice Bridges off-chain governance (like Snapshot) with on-chain execution.
 * @dev Validates cryptographic signatures to ensure that results calculated off-chain
 * have not been tampered with before being settled on the blockchain.
 * @custom:security-note Prevents replay attacks by tracking executed Proposal IDs.
 * @author NexTechArchitect
 */
contract OffchainResultExecutor {
    using SignatureVerifier for bytes32;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error OnlyTimelock();
    error InvalidSignature();
    error ResultAlreadyExecuted();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/
    address public immutable timelock;

    // Tracks processed proposals to prevent double-execution (Replay Attack Protection)
    mapping(uint256 => bool) public executed;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the bridge with the authorized controller.
     * @param _timelock The Governance Timelock address.
     */
    constructor(address _timelock) {
        if (_timelock == address(0)) revert ZeroAddress();
        timelock = _timelock;
    }

    /*//////////////////////////////////////////////////////////////
                             EXTERNAL LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Settles an off-chain vote on-chain.
     * @dev verifies that the provided result hash was signed by the specific 'signer'.
     * This ensures the data integrity of off-chain calculations.
     * * @param proposalId The unique ID of the off-chain proposal.
     * @param resultHash The hash of the voting result (e.g., Merkle Root of votes).
     * @param signer The address of the trusted oracle/validator who signed the result.
     * @param signature The cryptographic signature proving the signer approved this result.
     */
    function executeOffchainResult(
        uint256 proposalId,
        bytes32 resultHash,
        address signer,
        bytes calldata signature
    ) external {
        // Access Control: Only the DAO Timelock can trigger settlement
        if (msg.sender != timelock) revert OnlyTimelock();

        // Replay Protection: Ensure this specific proposal hasn't been settled before
        if (executed[proposalId]) revert ResultAlreadyExecuted();

        // Construct the data payload that was expected to be signed
        bytes32 messageToVerify = keccak256(
            abi.encodePacked(proposalId, resultHash)
        );

        // Verify the signature against the claimed signer
        bool isValid = SignatureVerifier.verify(
            signer,
            messageToVerify,
            signature
        );

        if (!isValid) revert InvalidSignature();

        // Mark as executed to prevent future replays
        executed[proposalId] = true;
    }
}
