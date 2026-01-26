// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureVerifier} from "../utils/SignatureVerifier.sol";

import {ZeroAddress} from "../errors/CommonErrors.sol";
import {
    OnlyTimelock,
    InvalidSignature,
    ResultAlreadyExecuted
} from "../errors/GovernanceErrors.sol";

/**
 * @title Offchain Result Executor
 * @notice Validates off-chain voting results via EIP-712 signatures for Snapshot X integration.
 * @dev Optimized with assembly hashing and centralized signature verification.
 * @author NexTechArchitect
 */
contract OffchainResultExecutor is EIP712 {
    address public immutable TIMELOCK;
    address public signer;

    bytes32 private constant RESULT_TYPEHASH =
        keccak256("OffchainResult(uint256 proposalId,bytes32 resultHash)");

    mapping(uint256 => bool) public executedResults;

    event ResultExecuted(uint256 indexed proposalId, bytes32 resultHash);
    event SignerUpdated(address oldSigner, address newSigner);

    modifier onlyTimelock() {
        _checkTimelock();
        _;
    }

    function _checkTimelock() internal view {
        if (msg.sender != TIMELOCK) revert OnlyTimelock();
    }

    constructor(
        address _timelock,
        address _signer,
        string memory name,
        string memory version
    ) EIP712(name, version) {
        if (_timelock == address(0) || _signer == address(0))
            revert ZeroAddress();
        TIMELOCK = _timelock;
        signer = _signer;
    }

    /**
     * @notice Updates the authorized signer address.
     * @dev Only callable by the Timelock DAO.
     */
    function setSigner(address _signer) external onlyTimelock {
        if (_signer == address(0)) revert ZeroAddress();
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    /**
     * @notice Returns the EIP-712 Domain Separator.
     * @dev Crucial for generating valid signatures in Tests and Frontends.
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Executes a proposal result if the signature is valid and not replayed.
     * @param proposalId The ID of the off-chain proposal.
     * @param resultHash The hash of the voting result (e.g., Merkle Root).
     * @param signature The EIP-712 signature from the authorized signer.
     */
    function executeResult(
        uint256 proposalId,
        bytes32 resultHash,
        bytes calldata signature
    ) external {
        if (executedResults[proposalId]) revert ResultAlreadyExecuted();

        bytes32 structHash;
        bytes32 typeHash = RESULT_TYPEHASH;

        assembly {
            let ptr := mload(0x40)
            mstore(ptr, typeHash)
            mstore(add(ptr, 0x20), proposalId)
            mstore(add(ptr, 0x40), resultHash)
            structHash := keccak256(ptr, 0x60) 
        }

        bytes32 hash = _hashTypedDataV4(structHash);

        if (!SignatureVerifier.verify(signer, hash, signature)) {
            revert InvalidSignature();
        }

        executedResults[proposalId] = true;
        emit ResultExecuted(proposalId, resultHash);
    }
}