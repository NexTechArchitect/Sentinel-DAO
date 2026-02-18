// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DelegationRegistry} from "../../src/contracts/delegation/DelegationRegistry.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {InvalidSignature, SignatureExpired} from "../../src/contracts/errors/GovernanceErrors.sol";

contract MockSmartWallet is IERC1271 {
    address public owner;
    constructor(address _owner) {
        owner = _owner;
    }

    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view override returns (bytes4) {
        (address recovered, , ) = ECDSA.tryRecover(hash, signature);
        if (recovered == owner) {
            return IERC1271.isValidSignature.selector;
        }
        return 0xffffffff;
    }
}

contract DelegationRegistryTest is Test {
    DelegationRegistry public registry;

    address public delegator;
    uint256 public delegatorPk;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    bytes32 public constant DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegator,address delegatee,uint256 nonce,uint256 deadline)");

    function setUp() public {
        (delegator, delegatorPk) = makeAddrAndKey("delegator");
        registry = new DelegationRegistry("DAO Delegation", "1");
    }

    function _signBytes(
        address _delegator,
        address _delegatee,
        uint256 _nonce,
        uint256 _deadline,
        uint256 _pk
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                DELEGATION_TYPEHASH,
                _delegator,
                _delegatee,
                _nonce,
                _deadline
            )
        );

        bytes32 digest = MessageHashUtils.toTypedDataHash(
            registry.getDomainSeparator(),
            structHash
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_Delegate_Success() public {
        vm.prank(delegator);
        vm.expectEmit(true, true, false, false);
        emit DelegationRegistry.Delegated(delegator, alice);
        
        registry.delegate(alice);
        
        assertEq(registry.getDelegate(delegator), alice);
    }

    function test_Delegate_HistoryCheckpoints() public {
        vm.roll(10);
        vm.prank(delegator);
        registry.delegate(alice);

        vm.roll(20);
        vm.prank(delegator);
        registry.delegate(bob);

        assertEq(registry.getDelegate(delegator), bob);
        assertEq(registry.getDelegateAt(delegator, 15), alice);
    }

    function test_DelegateBySig_Success() public {
        uint256 nonce = registry.nonces(delegator);
        uint256 deadline = block.timestamp + 100;

        bytes memory signature = _signBytes(
            delegator,
            alice,
            nonce,
            deadline,
            delegatorPk
        );

        registry.delegateBySig(delegator, alice, nonce, deadline, signature);

        assertEq(registry.getDelegate(delegator), alice);
        assertEq(registry.nonces(delegator), nonce + 1);
    }

    function test_DelegateBySig_SmartWallet() public {
        uint256 ownerPk = 0xA11CE;
        address owner = vm.addr(ownerPk);
        MockSmartWallet wallet = new MockSmartWallet(owner);

        uint256 nonce = registry.nonces(address(wallet));
        uint256 deadline = block.timestamp + 100;

        bytes memory signature = _signBytes(
            address(wallet),
            alice,
            nonce,
            deadline,
            ownerPk
        );

        registry.delegateBySig(
            address(wallet),
            alice,
            nonce,
            deadline,
            signature
        );

        assertEq(registry.getDelegate(address(wallet)), alice);
        assertEq(registry.nonces(address(wallet)), nonce + 1);
    }

    function test_DelegateBySig_RevertIf_Replay() public {
        uint256 nonce = registry.nonces(delegator);
        uint256 deadline = block.timestamp + 100;
        bytes memory signature = _signBytes(
            delegator,
            alice,
            nonce,
            deadline,
            delegatorPk
        );

        registry.delegateBySig(delegator, alice, nonce, deadline, signature);

        vm.expectRevert(InvalidSignature.selector);
        registry.delegateBySig(delegator, alice, nonce, deadline, signature);
    }

    function test_DelegateBySig_RevertIf_WrongNonce() public {
        uint256 nonce = registry.nonces(delegator) + 1;
        uint256 deadline = block.timestamp + 100;
        bytes memory signature = _signBytes(
            delegator,
            alice,
            nonce,
            deadline,
            delegatorPk
        );

        vm.expectRevert(InvalidSignature.selector);
        registry.delegateBySig(delegator, alice, nonce, deadline, signature);
    }

    function test_DelegateBySig_RevertIf_Expired() public {
        uint256 nonce = registry.nonces(delegator);
        uint256 deadline = block.timestamp - 1;
        bytes memory signature = _signBytes(
            delegator,
            alice,
            nonce,
            deadline,
            delegatorPk
        );

        vm.expectRevert(SignatureExpired.selector);
        registry.delegateBySig(delegator, alice, nonce, deadline, signature);
    }
}
