// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../src/contracts/core/GovernanceToken.sol";

contract GovernanceTokenTest is Test {
    GovernanceToken token;

    // realistic addresses
    address deployer = address(100);
    address governanceExecutor = address(200);
    address treasuryWallet = address(300);
    address communityMember = address(400);
    address attacker = address(999);

    uint256 constant INITIAL_SUPPLY = 150_000_000 ether;

    function setUp() public {
        vm.startPrank(deployer);

        token = new GovernanceToken(treasuryWallet, governanceExecutor);

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_initial_supply_minted_correctly() public view {
        uint256 supply = token.totalSupply();
        assertEq(supply, INITIAL_SUPPLY);
    }

    function test_initial_receiver_balance() public view {
        assertEq(token.balanceOf(treasuryWallet), INITIAL_SUPPLY);
    }

    function test_initial_receiver_has_no_votes_until_delegated() public view {
        uint256 votes = token.getVotes(treasuryWallet);
        assertEq(votes, 0);
    }

    function test_self_delegate_activates_voting_power() public {
        vm.prank(treasuryWallet);
        token.delegate(treasuryWallet);

        uint256 votes = token.getVotes(treasuryWallet);
        assertEq(votes, INITIAL_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                            MINT LOGIC
    //////////////////////////////////////////////////////////////*/

    function test_governance_executor_can_mint() public {
        vm.prank(governanceExecutor);
        token.mint(communityMember, 1_000 ether);

        assertEq(token.balanceOf(communityMember), 1_000 ether);
    }

    function test_non_governance_cannot_mint() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.mint(attacker, 100 ether);
    }

    function test_mint_updates_total_supply() public {
        uint256 beforeSupply = token.totalSupply();

        vm.prank(governanceExecutor);
        token.mint(communityMember, 5_000 ether);

        uint256 afterSupply = token.totalSupply();

        assertEq(afterSupply, beforeSupply + 5_000 ether);
    }

    function test_mint_exceeding_max_supply_reverts() public {
        vm.prank(governanceExecutor);

        vm.expectRevert();
        token.mint(communityMember, 900_000_000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            TRANSFER + VOTES
    //////////////////////////////////////////////////////////////*/

    function test_transfer_does_not_move_votes_without_delegate() public {
        vm.prank(treasuryWallet);
        token.transfer(communityMember, 1_000 ether);

        assertEq(token.getVotes(communityMember), 0);
    }

    function test_transfer_updates_votes_after_delegate() public {
        vm.prank(treasuryWallet);
        token.delegate(treasuryWallet);

        vm.prank(treasuryWallet);
        token.transfer(communityMember, 10_000 ether);

        uint256 remainingVotes = token.getVotes(treasuryWallet);
        assertEq(remainingVotes, INITIAL_SUPPLY - 10_000 ether);
    }

    function test_delegate_to_other_user() public {
        vm.prank(treasuryWallet);
        token.delegate(communityMember);

        uint256 votes = token.getVotes(communityMember);
        assertEq(votes, INITIAL_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                        SNAPSHOT / PAST VOTES
    //////////////////////////////////////////////////////////////*/

    function test_get_past_votes() public {
        vm.prank(treasuryWallet);
        token.delegate(treasuryWallet);

        uint256 blockBefore = block.number;

        vm.roll(block.number + 1);

        uint256 pastVotes = token.getPastVotes(treasuryWallet, blockBefore);

        assertEq(pastVotes, INITIAL_SUPPLY);
    }

    function test_get_past_total_supply() public {
        uint256 blockBefore = block.number;

        vm.roll(block.number + 1);

        uint256 pastSupply = token.getPastTotalSupply(blockBefore);

        assertEq(pastSupply, INITIAL_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                        PERMIT TEST (ERC20Permit)
    //////////////////////////////////////////////////////////////*/

    function test_domain_separator_exists() public view {
        bytes32 separator = token.DOMAIN_SEPARATOR();
        assertTrue(separator != bytes32(0));
    }
}
