// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {
    VotingPowerSnapshot
} from "../../src/contracts/offchain/VotingPowerSnapshot.sol";
import {MockVotesToken} from "../mocks/MockVotesToken.sol";

contract VotingPowerSnapshotTest is Test {
    VotingPowerSnapshot snapshot;
    MockVotesToken token;

    address internal constant ALICE = address(0xA1);
    address internal constant BOB = address(0xB2);
    address internal constant CHARLIE = address(0xC3);

    uint256 internal constant PID_1 = 1;

    function setUp() public {
        // Start at Block 100 to avoid underflow/zero-block issues
        vm.roll(100);

        token = new MockVotesToken();
        snapshot = new VotingPowerSnapshot(address(token));

        // Setup Initial Balances
        token.mint(ALICE, 1000 ether);
        token.mint(BOB, 500 ether);
        token.mint(CHARLIE, 250 ether);

        // Setup Delegation (Required for Votes)
        vm.prank(ALICE);
        token.delegate(ALICE);

        vm.prank(BOB);
        token.delegate(BOB);

        vm.prank(CHARLIE);
        token.delegate(CHARLIE);

        // Finalize Checkpoints by mining a block
        vm.roll(block.number + 1);
    }

    /*//////////////////////////////////////////////////////////////
                        1. CORE LOGIC TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreateSnapshot_RecordsCorrectBlock() public {
        uint256 expectedBlock = block.number - 1;

        vm.expectEmit(true, false, false, true);
        emit VotingPowerSnapshot.SnapshotCreated(PID_1, expectedBlock);

        snapshot.createSnapshot(PID_1);

        assertEq(snapshot.snapshotBlock(PID_1), expectedBlock);
    }

    // CRITICAL TEST: Proof of Snapshot Isolation
    function test_Snapshot_IsIsolatedFromFutureChanges() public {
        // 1. Create Snapshot at Block X
        snapshot.createSnapshot(PID_1);
        uint256 snapBlock = snapshot.snapshotBlock(PID_1);

        // 2. Move Forward & Change State
        vm.roll(block.number + 5);

        // Alice transfers EVERYTHING to Bob
        vm.prank(ALICE);
        token.transfer(BOB, 1000 ether);

        // Mine block to record transfer
        vm.roll(block.number + 1);

        // 3. Verify Current State (Changed)
        assertEq(token.getVotes(ALICE), 0, "Alice current votes should be 0");
        assertEq(
            token.getVotes(BOB),
            1500 ether,
            "Bob current votes should be 1500"
        );

        // 4. Verify Snapshot State (Unchanged - The Core Logic)
        uint256 aliceSnapVotes = snapshot.votePowerAt(PID_1, ALICE);
        uint256 bobSnapVotes = snapshot.votePowerAt(PID_1, BOB);

        assertEq(
            aliceSnapVotes,
            1000 ether,
            "Snapshot should see Alice's old balance"
        );
        assertEq(
            bobSnapVotes,
            500 ether,
            "Snapshot should see Bob's old balance"
        );
    }

    function test_TotalSupplyAtSnapshot() public {
        snapshot.createSnapshot(PID_1);
        vm.roll(block.number + 1);

        // Mint more tokens AFTER snapshot
        token.mint(ALICE, 5000 ether);
        vm.roll(block.number + 1);

        // Snapshot supply should ignore the new mint
        uint256 totalSupplySnap = snapshot.totalSupplyAt(PID_1);
        assertEq(totalSupplySnap, 1750 ether); // 1000 + 500 + 250
    }

    /*//////////////////////////////////////////////////////////////
                        2. NEGATIVE TESTS (REVERTS)
    //////////////////////////////////////////////////////////////*/

    function test_RevertIf_ProposalIdIsZero() public {
        vm.expectRevert(VotingPowerSnapshot.InvalidProposalId.selector);
        snapshot.createSnapshot(0);
    }

    function test_RevertIf_SnapshotAlreadyExists() public {
        snapshot.createSnapshot(PID_1);

        vm.expectRevert(
            abi.encodeWithSelector(
                VotingPowerSnapshot.SnapshotAlreadyExists.selector,
                PID_1
            )
        );
        snapshot.createSnapshot(PID_1);
    }

    function test_RevertIf_QueryingNonExistentSnapshot() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                VotingPowerSnapshot.SnapshotNotFound.selector,
                999 // Random ID
            )
        );
        snapshot.votePowerAt(999, ALICE);
    }

    function test_RevertIf_QueryingTotalSupplyForMissingSnapshot() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                VotingPowerSnapshot.SnapshotNotFound.selector,
                888
            )
        );
        snapshot.totalSupplyAt(888);
    }

    /*//////////////////////////////////////////////////////////////
                        3. FUZZ TESTS (STRESS TESTING)
    //////////////////////////////////////////////////////////////*/

    function testFuzz_CreateMultipleSnapshots(
        uint256 pid1,
        uint256 pid2
    ) public {
        // Filter invalid inputs
        vm.assume(pid1 != 0 && pid2 != 0);
        vm.assume(pid1 != pid2);

        snapshot.createSnapshot(pid1);

        // Move time forward
        vm.roll(block.number + 10);

        snapshot.createSnapshot(pid2);

        assertGt(snapshot.snapshotBlock(pid2), snapshot.snapshotBlock(pid1));
    }

    function testFuzz_VotingPowerAccuracy(address voter, uint96 amount) public {
        vm.assume(voter != address(0));
        vm.assume(voter != ALICE && voter != BOB && voter != CHARLIE); // Use new voter
        vm.assume(amount > 0);

        // 1. Setup random voter
        token.mint(voter, amount);
        vm.prank(voter);
        token.delegate(voter);

        // Mine block
        vm.roll(block.number + 1);

        // 2. Snapshot
        uint256 fuzzPid = 12345;
        snapshot.createSnapshot(fuzzPid);
        vm.roll(block.number + 1);

        // 3. Check
        assertEq(snapshot.votePowerAt(fuzzPid, voter), amount);
    }
}
