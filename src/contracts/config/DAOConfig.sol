// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title DAO Governance Configuration
 * @notice Centralized registry for adjustable governance parameters.
 * @dev Stores critical bounds and settings for the DAO. Only the Timelock 
 * (via a successful governance vote) can modify these values.
 * @author NexTechArchitect
 */
contract DAOConfig {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error OnlyTimelock();
    error InvalidValue();
    error SameValue();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event VotingDelayUpdated(uint48 oldValue, uint48 newValue);
    event VotingPeriodUpdated(uint32 oldValue, uint32 newValue);
    event QuorumUpdated(uint16 oldValue, uint16 newValue);
    event ProposalThresholdUpdated(uint256 oldValue, uint256 newValue);

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/
    address public immutable timelock;

    // Safety bounds (prevents DAO bricking)
    uint32 public constant MIN_VOTING_PERIOD = 7200; // ~1 day
    uint32 public constant MAX_VOTING_PERIOD = 50400; // ~7 days

    uint48 public votingDelay;
    uint32 public votingPeriod;
    uint16 public quorumPercentage;
    uint256 public proposalThreshold;

    /*//////////////////////////////////////////////////////////////
                                MODIFIER
    //////////////////////////////////////////////////////////////*/
    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the governance configuration with safety checks.
     * @param _timelock The address of the Timelock controller (The Owner).
     * @param _votingDelay Initial delay before voting starts.
     * @param _votingPeriod Initial duration of the voting window.
     * @param _quorumPercentage Initial quorum requirement.
     * @param _proposalThreshold Initial token requirement to submit a proposal.
     */
    constructor(
        address _timelock,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint16 _quorumPercentage,
        uint256 _proposalThreshold
    ) {
        if (_timelock == address(0)) revert InvalidValue();
        if (_votingPeriod < MIN_VOTING_PERIOD) revert InvalidValue();

        timelock = _timelock;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        proposalThreshold = _proposalThreshold;
    }

    /*//////////////////////////////////////////////////////////////
                           GOVERNANCE UPDATES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates the delay between proposal creation and voting start.
     * @dev Only callable via Timelock. Enforces non-zero values to prevent instant attacks.
     * @param newDelay The new delay value.
     */
    function updateVotingDelay(uint48 newDelay) external onlyTimelock {
        if (newDelay == votingDelay) revert SameValue();
        if (newDelay == 0) revert InvalidValue();

        uint48 old = votingDelay;
        votingDelay = newDelay;

        emit VotingDelayUpdated(old, newDelay);
    }

    /**
     * @notice Updates the duration of the voting window.
     * @dev Strictly enforces MIN/MAX bounds to ensure DAO stability.
     * @param newPeriod The new voting duration in blocks/seconds.
     */
    function updateVotingPeriod(uint32 newPeriod) external onlyTimelock {
        if (newPeriod < MIN_VOTING_PERIOD || newPeriod > MAX_VOTING_PERIOD)
            revert InvalidValue();

        if (newPeriod == votingPeriod) revert SameValue();

        uint32 old = votingPeriod;
        votingPeriod = newPeriod;

        emit VotingPeriodUpdated(old, newPeriod);
    }

    /**
     * @notice Updates the minimum participation percentage required for a vote to pass.
     * @dev Value represents percentage (e.g., 4 = 4%). Cannot be 0 or > 100.
     * @param newQuorum The new quorum percentage.
     */
    function updateQuorum(uint16 newQuorum) external onlyTimelock {
        if (newQuorum == 0 || newQuorum > 100) revert InvalidValue();
        if (newQuorum == quorumPercentage) revert SameValue();

        uint16 old = quorumPercentage;
        quorumPercentage = newQuorum;

        emit QuorumUpdated(old, newQuorum);
    }

    /**
     * @notice Updates the token balance required to create a proposal.
     * @dev Used to mitigate spam proposals by raising the entry barrier.
     * @param newThreshold The new token amount required.
     */
    function updateProposalThreshold(
        uint256 newThreshold
    ) external onlyTimelock {
        if (newThreshold == 0) revert InvalidValue();
        if (newThreshold == proposalThreshold) revert SameValue();

        uint256 old = proposalThreshold;
        proposalThreshold = newThreshold;

        emit ProposalThresholdUpdated(old, newThreshold);
    }
}