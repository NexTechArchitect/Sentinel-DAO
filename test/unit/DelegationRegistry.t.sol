// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {
    DelegationRegistry
} from "../../src/contracts/delegation/DelegationRegistry.sol";

contract DelegationRegistryTest is Test {
    DelegationRegistry registry;

    address user1;
    address user2;

    uint256 user1Pk;

    function setUp() public {
        registry = new DelegationRegistry();

        // Setup User 1 (Delegator)
        user1Pk = 0xA11CE;
        user1 = vm.addr(user1Pk);

        // Setup User 2 (Representative)
        user2 = address(0xB0B);
    }

    /*//////////////////////////////////////////////////////////////
                            DEFAULT BEHAVIOUR
    //////////////////////////////////////////////////////////////*/

    function test_delegateOf_returnsSelfIfNotDelegated() public view {
        address delegatee = registry.delegateOf(user1);
        assertEq(delegatee, user1);
    }

    /*//////////////////////////////////////////////////////////////
                            DIRECT DELEGATION
    //////////////////////////////////////////////////////////////*/

    function test_directDelegation() public {
        vm.prank(user1);
        registry.delegate(user2);

        assertEq(registry.delegateOf(user1), user2);
    }

    /*//////////////////////////////////////////////////////////////
                            SIGNATURE DELEGATION
    //////////////////////////////////////////////////////////////*/

    // FIX: Removed 'view' keyword here because delegateBySig changes state
    function test_delegateBySignature() public {
        uint256 deadline = block.timestamp + 1 days;

        // 1. Create the Struct Hash using user1 and user2
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Delegation(address delegator,address delegatee,uint256 nonce,uint256 deadline)"
                ),
                user1,
                user2,
                0, // Initial nonce is 0
                deadline
            )
        );

        // 2. Manual Domain Separator Calculation
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256("DelegationRegistry"),
                keccak256("1"),
                block.chainid,
                address(registry)
            )
        );

        // 3. Create Digest
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        // 4. Sign with User 1's Private Key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1Pk, digest);

        bytes memory signature = abi.encodePacked(r, s, v);

        // 5. Execute Delegation
        registry.delegateBySig(user1, user2, deadline, signature);

        // 6. Assertions
        assertEq(registry.delegateOf(user1), user2);
        assertEq(registry.nonces(user1), 1);
    }

    function test_revert_if_signatureExpired() public {
        uint256 deadline = block.timestamp - 1;

        vm.expectRevert(DelegationRegistry.SignatureExpired.selector);
        registry.delegateBySig(user1, user2, deadline, hex"1234");
    }
}
