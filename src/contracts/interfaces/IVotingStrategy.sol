// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {VotingStrategies} from "../governance/VotingStrategies.sol";

/**
 * @title IVotingStrategy
 * @notice Exposes strategy logic for UI and external integrations.
 */
interface IVotingStrategy {
    function calculateVotingPower(
        VotingStrategies.Strategy strategy,
        uint256 balance,
        uint256 holdingDuration
    ) external pure returns (uint256);

    function strategyName(
        VotingStrategies.Strategy strategy
    ) external pure returns (string memory);
}
