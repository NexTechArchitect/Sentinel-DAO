// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {SignatureVerifier} from "../utils/SignatureVerifier.sol";
import {ZeroAddress} from "../errors/CommonErrors.sol";
import {InvalidSignature, SignatureExpired} from "../errors/GovernanceErrors.sol";

/**
 * @title DelegationRegistry
 * @notice Advanced checkpoint-based delegation system supporting EIP-712 off-chain signatures.
 */
contract DelegationRegistry is EIP712 {
    using Checkpoints for Checkpoints.Trace208;

    bytes32 private constant DELEGATION_TYPEHASH =
        keccak256(
            "Delegation(address delegator,address delegatee,uint256 nonce,uint256 deadline)"
        );

    mapping(address => uint256) public nonces;

    mapping(address => Checkpoints.Trace208) private _delegateCheckpoints;

    event Delegated(address indexed delegator, address indexed delegatee);


    constructor(
        string memory name,
        string memory version
    ) EIP712(name, version) {}


    function getDelegate(address delegator) external view returns (address) {
        return address(uint160(_delegateCheckpoints[delegator].latest()));
    }


    /**
     * @notice Retrieves the delegatee of an address at a specific historical timepoint.
     * @param delegator The address that delegated their voting power.
     * @param timepoint The block number or timestamp to query.
     */
    function getDelegateAt(
        address delegator,
        uint48 timepoint
    ) external view returns (address) {
        return address(
            uint160(_delegateCheckpoints[delegator].upperLookup(timepoint))
        );
    }


    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }


    /**
     * @notice Sets a delegatee for the caller.
     * @param delegatee The address to receive the voting power.
     */
    function delegate(address delegatee) external {
        if (delegatee == address(0)) revert ZeroAddress();
        _delegate(msg.sender, delegatee);
    }

    /**
     * @notice Delegates voting power using an EIP-712 off-chain signature.
     * @param delegator The address granting delegation.
     * @param delegatee The address receiving delegation.
     * @param nonce Current nonce of the delegator for replay protection.
     * @param deadline Expiry timestamp for the signature.
     * @param signature The 65-byte ECDSA signature.
     */
    function delegateBySig(
        address delegator,
        address delegatee,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert SignatureExpired();
        if (delegatee == address(0)) revert ZeroAddress();

        if (nonce != nonces[delegator]) revert InvalidSignature();

        bytes32 structHash;
        bytes32 typeHash = DELEGATION_TYPEHASH;

        assembly {
            let ptr := mload(0x40)
            mstore(ptr, typeHash)
            mstore(add(ptr, 0x20), delegator)
            mstore(add(ptr, 0x40), delegatee)
            mstore(add(ptr, 0x60), nonce)
            mstore(add(ptr, 0x80), deadline)
            structHash := keccak256(ptr, 0xa0)
        }

        bytes32 hash = _hashTypedDataV4(structHash);

        if (!SignatureVerifier.verify(delegator, hash, signature)) {
            revert InvalidSignature();
        }

        unchecked {
            nonces[delegator]++;
        }
        _delegate(delegator, delegatee);
    }


    function _delegate(address delegator, address delegatee) internal {
        _delegateCheckpoints[delegator].push(
            uint48(block.number),
            uint208(uint160(delegatee))
        );
        emit Delegated(delegator, delegatee);
    }
}
