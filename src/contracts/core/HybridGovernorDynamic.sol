// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {DAOConfig} from "../config/DAOConfig.sol";
import {IProposalGuard} from "../interfaces/IProposalGuard.sol";
import {IGovernanceAnalytics} from "../interfaces/IGovernanceAnalytics.sol";
import {IVetoCouncil} from "../interfaces/IVetoCouncil.sol";
import {VotingStrategies} from "../governance/VotingStrategies.sol";

/**
 * @title HybridGovernorDynamic
 * @author NexTechArchitect
 * @notice Central governance engine with reputation-based voting and anti-spam protection.
 */
contract HybridGovernorDynamic is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    ReentrancyGuard
{
    // --- Governance States ---
    
    DAOConfig public daoConfig;
    address public vetoCouncil;
    address public proposalGuard;
    address public analytics;
    VotingStrategies.Strategy public currentStrategy;
    
    // --- Reputation & Anti-Spam Mappings ---

    mapping(address => int256) public proposerReputation;
    mapping(address => uint256) public tokenAcquisitionTime;
    mapping(uint256 => address) private _proposalProposers;
    mapping(address => uint256) public lastProposalTime;
    mapping(address => uint256[]) private _userActiveProposals;
    mapping(uint256 => VotingStrategies.Strategy) public proposalStrategy;

    // --- Governance Constants ---

    uint256 public constant MAX_ACTIVE_PROPOSALS = 10;
    uint256 public constant MIN_COOLDOWN = 1 hours;
    uint256 public constant MIN_DESCRIPTION_LENGTH = 100;
    int256 public constant MIN_REPUTATION = -1000;
    int256 public constant MAX_REPUTATION = 10000;
    uint256 public constant PROPOSAL_COOLDOWN = 1 days;
    uint256 public spamThresholdTokens;
    uint256 private constant MAX_CLEANUP_ITERATIONS = 50;

    // --- Events & Errors ---

    event ReputationUpdated(address indexed user, int256 newReputation);
    event StrategyUpdated(VotingStrategies.Strategy newStrategy);
    event ProposalVetoed(uint256 proposalId);
    event ModulesUpdated(address indexed guard, address indexed analytics);
    event TokenAcquisitionRecorded(address indexed account, uint256 timestamp);
    event ProposalStrategyLocked(uint256 indexed proposalId, VotingStrategies.Strategy strategy);
    event GuardRecordFailed(address indexed proposer, string reason);
    event AnalyticsUpdated(address indexed oldAnalytics, address indexed newAnalytics);
    event ProposalGuardUpdated(address indexed oldGuard, address indexed newGuard);

    error ProposalIsVetoed(); 
    error ZeroAddress();
    error ProposalCooldownActive(uint256 remaining);
    error DescriptionTooShort(uint256 provided, uint256 required);
    error LowReputation(int256 current, int256 required);
    error MaxProposalsReached();
    error ArrayLengthMismatch();


    constructor(
        IVotes _token,
        TimelockController _timelock,
        DAOConfig _config,
        address _vetoCouncil,
        uint256 _quorum
    )
        Governor("HybridDAO")
        GovernorSettings(1 days, 1 days, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorum)
        GovernorTimelockControl(_timelock)
    {
        if (address(_config) == address(0) || _vetoCouncil == address(0)) revert ZeroAddress();

        daoConfig = _config;
        vetoCouncil = _vetoCouncil;
        spamThresholdTokens = 10000 * 10**18;
    }


    /**
     * @notice Submits a proposal for voting. Includes cleanup of stale proposals and reputation checks.
     * @param targets Target addresses for the proposal actions.
     * @param values ETH values to be sent with each action.
     * @param calldatas Encoded function calls for each action.
     * @param description A string description of the proposal's intent.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        
        address proposer = msg.sender;

        if (targets.length != values.length || targets.length != calldatas.length) {
            revert ArrayLengthMismatch();
        }

        _cleanupUserProposals(proposer);

        if (_userActiveProposals[proposer].length >= MAX_ACTIVE_PROPOSALS) {
            revert MaxProposalsReached();
        }

        if (proposalGuard != address(0)) {
            try IProposalGuard(proposalGuard).recordProposal(proposer) {} catch {
                emit GuardRecordFailed(proposer, "recordProposal failed");
            }
            require(IProposalGuard(proposalGuard).validate(proposer, description), "Guard Check Failed");
        }

        _internalProposalValidation(proposer, description);

        uint256 proposalId = super.propose(targets, values, calldatas, description);

        _proposalProposers[proposalId] = proposer;
        _userActiveProposals[proposer].push(proposalId);
        proposalStrategy[proposalId] = currentStrategy;

        emit ProposalStrategyLocked(proposalId, currentStrategy);

        return proposalId;
    }


    /**
     * @notice Executes a successful proposal and rewards the proposer with reputation.
     * @dev Checks against VetoCouncil and analytics modules during execution.
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) nonReentrant {
        
        if (IVetoCouncil(vetoCouncil).isVetoed(proposalId)) revert ProposalIsVetoed();

        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
        
        address proposer = _proposalProposers[proposalId];
        
        if (proposer != address(0)) {
            int256 newReputation = proposerReputation[proposer] + 10;
            if (newReputation > MAX_REPUTATION) newReputation = MAX_REPUTATION;
            
            proposerReputation[proposer] = newReputation;
            emit ReputationUpdated(proposer, newReputation);
            
            _cleanupUserProposals(proposer);
        }

        if (analytics != address(0)) {
            try IGovernanceAnalytics(analytics).updateAnalytics(proposalId, true) {} catch {}
        }
    }


    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        
        uint256 pid = super._cancel(targets, values, calldatas, descriptionHash);
        address proposer = _proposalProposers[pid];
        
        if (proposer != address(0)) {
            int256 newReputation = proposerReputation[proposer] - 50;
            if (newReputation < MIN_REPUTATION) newReputation = MIN_REPUTATION;
            
            proposerReputation[proposer] = newReputation;
            emit ReputationUpdated(proposer, newReputation);
            
            _cleanupUserProposals(proposer);
        }

        return pid;
    }


    function _internalProposalValidation(address proposer, string memory description) internal {
        
        uint256 balance = token().getVotes(proposer);
        uint256 lastTime = lastProposalTime[proposer];
        
        if (lastTime != 0) {
            uint256 cooldown = (balance >= spamThresholdTokens) ? MIN_COOLDOWN : PROPOSAL_COOLDOWN;
            uint256 elapsed = block.timestamp - lastTime;
            
            if (elapsed < cooldown) revert ProposalCooldownActive(cooldown - elapsed);
        }

        if (bytes(description).length < MIN_DESCRIPTION_LENGTH) {
            revert DescriptionTooShort(bytes(description).length, MIN_DESCRIPTION_LENGTH);
        }

        if (proposerReputation[proposer] < MIN_REPUTATION) {
            revert LowReputation(proposerReputation[proposer], MIN_REPUTATION);
        }
        
        lastProposalTime[proposer] = block.timestamp;
    }


    function _cleanupUserProposals(address user) internal {
        
        uint256[] storage userProposals = _userActiveProposals[user];
        uint256 length = userProposals.length;
        
        if (length == 0) return;
        
        uint256 writeIndex = 0;
        
        for (uint256 i = 0; i < length && i < MAX_CLEANUP_ITERATIONS; ) {
            uint256 proposalId = userProposals[i];
            ProposalState currentState = state(proposalId);
            
            if (currentState != ProposalState.Canceled && 
                currentState != ProposalState.Executed && 
                currentState != ProposalState.Defeated && 
                currentState != ProposalState.Expired) {
                
                if (writeIndex != i) {
                    userProposals[writeIndex] = proposalId;
                }
                unchecked { ++writeIndex; }
            }
            unchecked { ++i; }
        }
        
        while (userProposals.length > writeIndex) {
            userProposals.pop();
        }
    }


    function setProposalGuard(address _guard) external onlyGovernance {
        if (_guard == address(0)) revert ZeroAddress();
        
        address old = proposalGuard;
        proposalGuard = _guard;
        
        emit ProposalGuardUpdated(old, _guard);
    }


    function setAnalytics(address _analytics) external onlyGovernance {
        if (_analytics == address(0)) revert ZeroAddress();
        
        address old = analytics;
        analytics = _analytics;
        
        emit AnalyticsUpdated(old, _analytics);
    }


    function updateVotingStrategy(VotingStrategies.Strategy _strategy) external onlyGovernance {
        currentStrategy = _strategy;
        emit StrategyUpdated(_strategy);
    }


    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        if (IVetoCouncil(vetoCouncil).isVetoed(proposalId)) return ProposalState.Defeated; 
        
        return super.state(proposalId);
    }


    function recordTokenAcquisition(address user) external {
        if (msg.sender == address(token())) {
            tokenAcquisitionTime[user] = block.timestamp;
            emit TokenAcquisitionRecorded(user, block.timestamp);
        }
    }


    // --- Governance Overrides ---

    function proposalProposer(uint256 proposalId) public view override returns (address) { 
        return _proposalProposers[proposalId]; 
    }

    function proposalNeedsQueuing(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (bool) { 
        return super.proposalNeedsQueuing(proposalId); 
    }

    function _queueOperations(uint256 proposalId, address[] memory t, uint256[] memory v, bytes[] memory c, bytes32 h) internal override(Governor, GovernorTimelockControl) returns (uint48) { 
        return super._queueOperations(proposalId, t, v, c, h); 
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) { 
        return super._executor(); 
    }

    function supportsInterface(bytes4 id) public view override(Governor) returns (bool) { 
        return super.supportsInterface(id); 
    }

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) { 
        return daoConfig.votingDelay(); 
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) { 
        return daoConfig.votingPeriod(); 
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) { 
        return daoConfig.proposalThreshold(); 
    }
}