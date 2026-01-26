// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {VotingStrategies} from "../../src/contracts/governance/VotingStrategies.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";


contract StrategyHarness {
    function getVotes(VotingStrategies.Strategy strategy, uint256 rawBalance) external pure returns (uint256) {
     
        return VotingStrategies.calculateVotingPower(strategy, rawBalance, 0);
    }
}

contract FuzzVotingStrategies is Test {
    StrategyHarness harness;

    function setUp() public {
        harness = new StrategyHarness();
    }

    function testFuzz_LinearStrategy(uint256 rawBalance) view public {
        vm.assume(rawBalance < type(uint128).max); 

        uint256 votes = harness.getVotes(VotingStrategies.Strategy.TokenWeighted, rawBalance);
        
        assertEq(votes, rawBalance, "Linear strategy should return exact balance");
    }

  
    function testFuzz_QuadraticStrategy(uint256 rawBalance) view public {
        vm.assume(rawBalance < type(uint128).max);

        uint256 votes = harness.getVotes(VotingStrategies.Strategy.QuadraticWeighted, rawBalance);
        
        uint256 expectedVotes = Math.sqrt(rawBalance);

        assertEq(votes, expectedVotes, "Quadratic strategy should return Sqrt(Balance)");
    }

    function test_ZeroBalanceBehavior() public view {
        uint256 val1 = harness.getVotes(VotingStrategies.Strategy.TokenWeighted, 0);
        uint256 val2 = harness.getVotes(VotingStrategies.Strategy.QuadraticWeighted, 0);

        assertEq(val1, 0, "Zero balance linear failed");
        assertEq(val2, 0, "Zero balance quadratic failed");
    }
}