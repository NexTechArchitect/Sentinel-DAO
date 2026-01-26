// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ZeroAddress, ZeroAmount} from "../errors/CommonErrors.sol";

/**
 * @title ConvictionStaking
 * @notice Allows users to lock tokens to gain governance conviction/voting power.
 */
contract ConvictionStaking is ReentrancyGuard {
    using SafeERC20 for IERC20;


    IERC20 public immutable TOKEN;


    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockedUntil;
    }


    mapping(address => Stake) public userStakes;
    uint256 public totalStaked;


    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Withdrawn(address indexed user, uint256 amount);


    error StillLocked(uint256 availableAt);
    error NoActiveStake();


    constructor(address _token) {
        if (_token == address(0)) revert ZeroAddress();
        TOKEN = IERC20(_token);
    }


    /**
     * @notice Deposits tokens into the staking contract with a time-lock.
     * @param amount The number of tokens to stake.
     * @param daysToLock The duration in days the tokens will be non-withdrawable.
     */
    function stake(uint256 amount, uint256 daysToLock) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        Stake storage s = userStakes[msg.sender];
        s.amount += amount;
        s.startTime = block.timestamp;
        s.lockedUntil = block.timestamp + (daysToLock * 1 days);

        unchecked {
            totalStaked += amount;
        }

        emit Staked(msg.sender, amount, daysToLock);
    }


    /**
     * @notice Withdraws the full staked balance after the lock period has expired.
     */
    function withdraw() external nonReentrant {
        Stake storage s = userStakes[msg.sender];

        if (s.amount == 0) revert NoActiveStake();
        if (block.timestamp < s.lockedUntil) revert StillLocked(s.lockedUntil);

        uint256 amount = s.amount;

        delete userStakes[msg.sender];

        unchecked {
            totalStaked -= amount;
        }

        TOKEN.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }


    function getStakedBalance(address user) external view returns (uint256) {
        return userStakes[user].amount;
    }
}