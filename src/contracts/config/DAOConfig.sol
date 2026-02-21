// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {InvalidValue, SameValue} from "../errors/CommonErrors.sol";
import {OnlyTimelock} from "../errors/GovernanceErrors.sol";

/**
 * @title DAOConfig
 * @notice Manages decentralized governance parameters for the DAO system.
 * @dev Authority is restricted to the Timelock contract to prevent central points of failure.
 */
contract DAOConfig {
    address public immutable TIMELOCK;

    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;
    uint256 public quorumPercentage;

    uint256 public constant MIN_VOTING_DELAY = 1 hours;
    uint256 public constant MAX_VOTING_DELAY = 30 days;
    uint256 public constant MIN_VOTING_PERIOD = 1 days;
    uint256 public constant MAX_VOTING_PERIOD = 365 days;
    uint256 public constant MIN_QUORUM = 0; 
    uint256 public constant MAX_QUORUM = 100;

    /**
     * @notice Emitted when a parameter is updated by the Timelock
     */
    event ConfigUpdated(string indexed param, uint256 newValue);


    modifier onlyTimelock() {
        _checkTimelock();
        _;
    }


    function _checkTimelock() internal view {
        if (msg.sender != TIMELOCK) revert OnlyTimelock();
    }


    /**
     * @param _timelock Address of the DAO Timelock
     * @param _delay Initial delay before voting starts
     * @param _period Duration of the voting phase
     * @param _threshold Minimum tokens required to create a proposal
     * @param _quorum Percentage of total supply required for quorum
     */
    constructor(
        address _timelock,
        uint256 _delay,
        uint256 _period,
        uint256 _threshold,
        uint256 _quorum
    ) {
        if (_timelock == address(0)) revert InvalidValue();
        if (_delay < MIN_VOTING_DELAY || _delay > MAX_VOTING_DELAY) revert InvalidValue();
        if (_period < MIN_VOTING_PERIOD || _period > MAX_VOTING_PERIOD) revert InvalidValue();
        if (_quorum > MAX_QUORUM) revert InvalidValue();

        TIMELOCK = _timelock;
        votingDelay = _delay;
        votingPeriod = _period;
        proposalThreshold = _threshold;
        quorumPercentage = _quorum;
    }


    /**
     * @notice Updates the voting delay (time between proposal and voting start)
     */
    function setVotingDelay(uint256 newDelay) external onlyTimelock {
        if (newDelay == votingDelay) revert SameValue();
        if (newDelay < MIN_VOTING_DELAY || newDelay > MAX_VOTING_DELAY) revert InvalidValue();
        
        votingDelay = newDelay;
        emit ConfigUpdated("votingDelay", newDelay);
    }

    /**
     * @notice Updates the voting period (duration of active voting)
     */
    function setVotingPeriod(uint256 newPeriod) external onlyTimelock {
        if (newPeriod == votingPeriod) revert SameValue();
        if (newPeriod < MIN_VOTING_PERIOD || newPeriod > MAX_VOTING_PERIOD) revert InvalidValue();
        
        votingPeriod = newPeriod;
        emit ConfigUpdated("votingPeriod", newPeriod);
    }


    /**
     * @notice Updates the token threshold required to submit a proposal
     */
    function setProposalThreshold(uint256 newThreshold) external onlyTimelock {
        if (newThreshold == proposalThreshold) revert SameValue();
        
        proposalThreshold = newThreshold;
        emit ConfigUpdated("proposalThreshold", newThreshold);
    }

    /**
     * @notice Updates the percentage of votes required for a quorum
     */
    function setQuorumPercentage(uint256 newQuorum) external onlyTimelock {
        if (newQuorum > MAX_QUORUM) revert InvalidValue();
        if (newQuorum == quorumPercentage) revert SameValue();
        
        quorumPercentage = newQuorum;
        emit ConfigUpdated("quorumPercentage", newQuorum);
    }
}
