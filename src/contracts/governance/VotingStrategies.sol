// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title VotingStrategies
 * @notice Internal library to calculate voting power based on different DAO strategies.
 */
library VotingStrategies {

    enum Strategy {
        TokenWeighted,
        QuadraticWeighted,
        ConvictionWeighted
    }


    /**
     * @notice Calculates the final voting power based on the selected strategy.
     * @param strategy The voting model to be used.
     * @param bal The raw token balance of the voter.
     * @param duration The time tokens have been held or locked (used for conviction).
     * @return uint256 The calculated voting power.
     */
    function calculateVotingPower(
        Strategy strategy,
        uint256 bal,
        uint256 duration
    ) internal pure returns (uint256) {

        if (strategy == Strategy.TokenWeighted) return bal;

        if (strategy == Strategy.QuadraticWeighted) return Math.sqrt(bal);

        if (strategy == Strategy.ConvictionWeighted) return applyTimeWeight(bal, duration);

        return bal;
    }


    /**
     * @dev Calculates time-based bonus: +10% per month, capped at 100% (2x power).
     */
    function applyTimeWeight(uint256 bal, uint256 duration) internal pure returns (uint256) {

        unchecked {
            uint256 months = duration / 30 days;
            uint256 bonus = months * 10;

            if (bonus > 100) bonus = 100;

            return (bal * (100 + bonus)) / 100;
        }
    }


    function strategyName(Strategy s) internal pure returns (string memory) {

        if (s == Strategy.TokenWeighted) return "Token-Weighted";

        if (s == Strategy.QuadraticWeighted) return "Quadratic";

        if (s == Strategy.ConvictionWeighted) return "Conviction";

        return "Unknown";
    }
}