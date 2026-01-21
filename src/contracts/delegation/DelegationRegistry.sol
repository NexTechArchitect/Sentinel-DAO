// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureVerifier} from "../utils/SignatureVerifier.sol";

/**
 * @title Vote Delegation Registry
 * @notice Manages the assignment of voting authority from one user to another.
 * @dev Supports both direct on-chain delegation and gasless off-chain delegation via EIP-712 signatures.
 * This registry allows users to delegate their voting power without transferring their tokens.
 * @author NexTechArchitect
 */
contract DelegationRegistry is EIP712 {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error InvalidSignature();
    error SignatureExpired();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event Delegated(address indexed delegator, address indexed delegatee);

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    // Mapping tracking who has delegated to whom (Delegator => Delegatee)
    mapping(address => address) private _delegates;

    // Nonce counter per user to prevent signature replay attacks.
    mapping(address => uint256) public nonces;

    /// @dev The EIP-712 type hash for verifying delegation signatures.
    bytes32 private constant DELEGATION_TYPEHASH =
        keccak256(
            "Delegation(address delegator,address delegatee,uint256 nonce,uint256 deadline)"
        );

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the EIP-712 domain separator.
     */
    constructor() EIP712("DelegationRegistry", "1") {}

    /*//////////////////////////////////////////////////////////////
                                  VIEW
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the active delegate for a given account.
     * @dev If the user has not delegated to anyone, it defaults to returning their own address (Self-Delegation).
     * @param account The address to check.
     * @return The address of the assigned delegate.
     */
    function delegateOf(address account) public view returns (address) {
        address delegatee = _delegates[account];
        if (delegatee == address(0)) {
            return account;
        } else {
            return delegatee;
        }
    }

    /*//////////////////////////////////////////////////////////////
                            DIRECT DELEGATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Performs a standard on-chain delegation.
     * @dev The caller pays the gas fees.
     * @param delegatee The address receiving the voting power.
     */
    function delegate(address delegatee) external {
        _setDelegate(msg.sender, delegatee);
    }

    /*//////////////////////////////////////////////////////////////
                           SIGNATURE DELEGATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Performs a gasless delegation using a signed message.
     * @dev This allows a third party (relayer) to submit the transaction on behalf of the delegator.
     * Uses EIP-712 typed data hashing for security.
     *
     * @param delegator The user who wants to delegate (the signer).
     * @param delegatee The user receiving the voting power.
     * @param deadline The timestamp after which the signature is invalid.
     * @param signature The cryptographic signature from the delegator.
     */
    function delegateBySig(
        address delegator,
        address delegatee,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert SignatureExpired();

        // Reconstruct the signed data structure
        bytes32 structHash = keccak256(
            abi.encode(
                DELEGATION_TYPEHASH,
                delegator,
                delegatee,
                nonces[delegator]++, // Increment nonce to prevent replay
                deadline
            )
        );

        // Compute the final EIP-712 digest
        bytes32 digest = _hashTypedDataV4(structHash);

        // Verify the signer
        bool valid = SignatureVerifier.verify(delegator, digest, signature);

        if (!valid) revert InvalidSignature();

        _setDelegate(delegator, delegatee);
    }

    /*//////////////////////////////////////////////////////////////
                                INTERNAL
    //////////////////////////////////////////////////////////////*/

    function _setDelegate(address delegator, address delegatee) internal {
        _delegates[delegator] = delegatee;
        emit Delegated(delegator, delegatee);
    }
}
