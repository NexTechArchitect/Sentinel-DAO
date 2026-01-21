// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Digital Signature Verifier
 * @notice A stateless utility library for verifying Elliptic Curve Digital Signatures (ECDSA).
 * @dev Abstracts the low-level cryptographic recovery operations provided by OpenZeppelin.
 * Used by the DelegationRegistry and OffchainResultExecutor to validate user intent without gas costs.
 * @author NexTechArchitect
 */
library SignatureVerifier {
    /**
     * @notice Recovers the address of the account that signed a specific message.
     * @dev Wraps ECDSA.recover to extract the signer from the signature (v, r, s).
     * @param messageHash The 32-byte hash of the data that was signed.
     * @param signature The 65-byte signature provided by the user.
     * @return The address that created the signature.
     */
    function recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        return ECDSA.recover(messageHash, signature);
    }

    /**
     * @notice Validates that a message was signed by a specific expected address.
     * @param expectedSigner The address authorized to sign the message.
     * @param messageHash The hash of the data.
     * @param signature The signature to verify.
     * @return True if the signature is valid and matches the expected signer.
     */
    function verify(
        address expectedSigner,
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        return recoverSigner(messageHash, signature) == expectedSigner;
    }
}
