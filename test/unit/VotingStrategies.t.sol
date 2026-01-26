// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {VotingStrategies} from "../../src/contracts/governance/VotingStrategies.sol";

contract VotingStrategiesTest is Test {
    using VotingStrategies for VotingStrategies.Strategy;

    uint256 constant E18 = 1e18;

    function test_Power_TokenWeighted() public pure {
        uint256 balance = 100 * E18;
        uint256 power = VotingStrategies.calculateVotingPower(
            VotingStrategies.Strategy.TokenWeighted,
            balance,
            0 
        );
        assertEq(power, balance, "TokenWeighted power must equal balance");
    }

    function test_Power_QuadraticWeighted() public pure {
        uint256 balance = 100 * E18;
        
        uint256 power = VotingStrategies.calculateVotingPower(
            VotingStrategies.Strategy.QuadraticWeighted,
            balance,
            0
        );
        
        assertEq(power, 10_000_000_000, "Quadratic power calculation mismatch");
    }

    function test_Power_ConvictionWeighted() public pure {
        uint256 balance = 100 * E18;

        uint256 power0 = VotingStrategies.calculateVotingPower(
            VotingStrategies.Strategy.ConvictionWeighted,
            balance,
            0
        );
        assertEq(power0, balance, "Zero duration should have no bonus");

        uint256 power30 = VotingStrategies.calculateVotingPower(
            VotingStrategies.Strategy.ConvictionWeighted,
            balance,
            30 days
        );
        assertEq(power30, 110 * E18, "30 days should give 10% bonus");

        uint256 power300 = VotingStrategies.calculateVotingPower(
            VotingStrategies.Strategy.ConvictionWeighted,
            balance,
            300 days
        );
        assertEq(power300, 200 * E18, "10 months should give 100% bonus");

        uint256 power500 = VotingStrategies.calculateVotingPower(
            VotingStrategies.Strategy.ConvictionWeighted,
            balance,
            500 days
        );
        assertEq(power500, 200 * E18, "Bonus should be capped at 100%");
    }

    function test_Strategy_Names() public pure {
        assertEq(VotingStrategies.strategyName(VotingStrategies.Strategy.TokenWeighted), "Token-Weighted");
        assertEq(VotingStrategies.strategyName(VotingStrategies.Strategy.QuadraticWeighted), "Quadratic");
        assertEq(VotingStrategies.strategyName(VotingStrategies.Strategy.ConvictionWeighted), "Conviction");
    }
}