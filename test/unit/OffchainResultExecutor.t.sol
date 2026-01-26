// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {OffchainResultExecutor} from "../../src/contracts/offchain/OffchainResultExecutor.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {OnlyTimelock, InvalidSignature, ResultAlreadyExecuted} from "../../src/contracts/errors/GovernanceErrors.sol";

contract OffchainResultExecutorTest is Test {
    OffchainResultExecutor public executor;

    address public timelock = makeAddr("timelock");
    address public signer;
    uint256 public signerPk;
    address public hacker = makeAddr("hacker");

    bytes32 public constant RESULT_TYPEHASH =
        keccak256("OffchainResult(uint256 proposalId,bytes32 resultHash)");

    event ResultExecuted(uint256 indexed proposalId, bytes32 resultHash);
    event SignerUpdated(address oldSigner, address newSigner);

    function setUp() public {
        (signer, signerPk) = makeAddrAndKey("signer");
        executor = new OffchainResultExecutor(
            timelock,
            signer,
            "Snapshot Executor",
            "1"
        );
    }

    function _signResult(
        uint256 _proposalId,
        bytes32 _resultHash,
        uint256 _pk
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(RESULT_TYPEHASH, _proposalId, _resultHash)
        );
        
        bytes32 digest = MessageHashUtils.toTypedDataHash(
            executor.getDomainSeparator(),
            structHash
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_InitialState() public view {
        assertEq(executor.TIMELOCK(), timelock);
        assertEq(executor.signer(), signer);
    }

    function test_ExecuteResult_Success() public {
        uint256 proposalId = 1;
        bytes32 resultHash = keccak256("Passed");

        bytes memory signature = _signResult(proposalId, resultHash, signerPk);

        vm.expectEmit(true, false, false, true);
        emit ResultExecuted(proposalId, resultHash);

        executor.executeResult(proposalId, resultHash, signature);

        assertTrue(executor.executedResults(proposalId));
    }

    function test_RevertIf_Replay() public {
        uint256 proposalId = 1;
        bytes32 resultHash = keccak256("Passed");
        bytes memory signature = _signResult(proposalId, resultHash, signerPk);

        executor.executeResult(proposalId, resultHash, signature);

        vm.expectRevert(ResultAlreadyExecuted.selector);
        executor.executeResult(proposalId, resultHash, signature);
    }

    function test_RevertIf_InvalidSignature() public {
        uint256 proposalId = 1;
        bytes32 resultHash = keccak256("Passed");
        
        (, uint256 fakePk) = makeAddrAndKey("fake");
        bytes memory signature = _signResult(proposalId, resultHash, fakePk);

        vm.expectRevert(InvalidSignature.selector);
        executor.executeResult(proposalId, resultHash, signature);
    }

    function test_RevertIf_DataTampered() public {
        uint256 proposalId = 1;
        bytes32 resultHash = keccak256("Passed");
        bytes32 wrongHash = keccak256("Failed");

        bytes memory signature = _signResult(proposalId, resultHash, signerPk);

        vm.expectRevert(InvalidSignature.selector);
        executor.executeResult(proposalId, wrongHash, signature);
    }

    function test_SetSigner_Success() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(timelock);
        vm.expectEmit(false, false, false, true);
        emit SignerUpdated(signer, newSigner);
        
        executor.setSigner(newSigner);
        assertEq(executor.signer(), newSigner);
    }

    function test_SetSigner_RevertIf_NotTimelock() public {
        vm.prank(hacker);
        vm.expectRevert(OnlyTimelock.selector);
        executor.setSigner(hacker);
    }
}