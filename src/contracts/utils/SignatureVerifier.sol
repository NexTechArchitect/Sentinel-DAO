// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

/**
 * @title Universal Signature Verifier
 * @notice Gas-optimized library to validate signatures from EOAs and Smart Contracts (EIP-1271).
 * @author NexTechArchitect
 */
library SignatureVerifier {
    /**
     * @notice Verifies that a signature belongs to a specific signer.
     * @param signer The address claiming to have signed.
     * @param digest The hash of the data signed.
     * @param signature The signature bytes.
     * @return bool True if signature is valid.
     */
   function verify(
        address signer,
        bytes32 digest,
        bytes memory signature
    ) internal view returns (bool) {
        
        (address recovered, ECDSA.RecoverError error, ) = ECDSA.tryRecover(
            digest,
            signature
        );

        if (error == ECDSA.RecoverError.NoError && recovered == signer) {
            return true;
        }

        if (signer.code.length > 0) {
            try IERC1271(signer).isValidSignature(digest, signature) returns (
                bytes4 response
            ) {
                return response == IERC1271.isValidSignature.selector;
            } catch {
                return false;
            }
        }

        return false;
    }
}