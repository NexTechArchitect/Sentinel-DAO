// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ZeroAddress, ZeroAmount} from "../errors/CommonErrors.sol";

/**
 * @title ConvictionVoting
 * @notice Implements time-weighted voting power (ve-logic) where longer locks grant higher multipliers.
 */
contract ConvictionVoting is ReentrancyGuard {
    using SafeERC20 for IERC20;


    struct Proposal {
        uint128 totalConviction; 
        uint48 startTime;        
        bool executed;           
    }


    struct VoterState {
        uint128 stakedAmount;    
        uint128 votingPower;     
        uint48 lockedUntil;      
    }


    IERC20 public immutable TOKEN;
    address public immutable ROLE_MANAGER; 


    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoterState)) public voterStates;


    uint256 public constant MAX_LOCK_DAYS = 365 * 4; 
    uint256 public constant BASE_MULTIPLIER = 100;   
    uint256 public constant MAX_MULTIPLIER = 400;    


    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 amount, uint256 power);
    event VoteWithdrawn(uint256 indexed proposalId, address indexed voter, uint256 amount);


    error LockActive(uint48 lockedUntil);
    error AlreadyExecuted();
    error NoStakeFound();
    error InvalidLockDuration();


    constructor(address _token, address _roleManager) {
        if (_token == address(0) || _roleManager == address(0)) revert ZeroAddress();
        TOKEN = IERC20(_token);
        ROLE_MANAGER = _roleManager;
    }


    /**
     * @notice Locks tokens to cast a weighted vote. Power scales linearly with lock duration.
     * @param proposalId The unique identifier of the proposal.
     * @param amount The amount of tokens to stake for this vote.
     * @param lockDays The number of days to lock (max 1460 days for 4x power).
     */
    function castVote(
        uint256 proposalId,
        uint128 amount,
        uint256 lockDays
    ) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (lockDays > MAX_LOCK_DAYS) revert InvalidLockDuration();

        Proposal storage p = proposals[proposalId];
        if (p.executed) revert AlreadyExecuted();


        // Calculate Power: 1x + (3x * (lockDays / MAX_LOCK_DAYS))
        uint256 multiplier = BASE_MULTIPLIER + ((lockDays * (MAX_MULTIPLIER - BASE_MULTIPLIER)) / MAX_LOCK_DAYS);
        uint128 votingPower = uint128((uint256(amount) * multiplier) / 100);


        VoterState storage vs = voterStates[proposalId][msg.sender];
        uint48 newLockExpiry = uint48(block.timestamp + (lockDays * 1 days));

        if (newLockExpiry < vs.lockedUntil) {
            newLockExpiry = vs.lockedUntil; 
        }


        unchecked {
            vs.stakedAmount += amount;
            vs.votingPower += votingPower;
            vs.lockedUntil = newLockExpiry;
            p.totalConviction += votingPower;
        }


        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        emit VoteCast(proposalId, msg.sender, amount, votingPower);
    }


    /**
     * @notice Withdraws staked tokens only after the specific lock period has expired.
     */
    function withdrawVote(uint256 proposalId) external nonReentrant {
        VoterState storage vs = voterStates[proposalId][msg.sender];
        
        if (vs.stakedAmount == 0) revert NoStakeFound();
        if (block.timestamp < vs.lockedUntil) revert LockActive(vs.lockedUntil);

        uint128 amount = vs.stakedAmount;
        uint128 power = vs.votingPower;


        delete voterStates[proposalId][msg.sender];


        unchecked {
            if (proposals[proposalId].totalConviction >= power) {
                proposals[proposalId].totalConviction -= power;
            } else {
                proposals[proposalId].totalConviction = 0; 
            }
        }


        TOKEN.safeTransfer(msg.sender, amount);

        emit VoteWithdrawn(proposalId, msg.sender, amount);
    }


    function getProposalConviction(uint256 proposalId) external view returns (uint256) {
        return proposals[proposalId].totalConviction;
    }


    function getVoterState(uint256 proposalId, address voter) external view returns (uint128, uint128, uint48) {
        VoterState memory vs = voterStates[proposalId][voter];
        return (vs.stakedAmount, vs.votingPower, vs.lockedUntil);
    }
}