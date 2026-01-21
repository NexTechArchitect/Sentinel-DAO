// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {
    ERC20Permit
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {
    ERC20Votes
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

import {
    GovernanceToken__NotGovernance,
    GovernanceToken__MaxSupplyExceeded
} from "../errors/GovernanceErrors.sol";

/**
 * @title DISO Governance Token
 * @notice The core voting unit of the DAO ecosystem.
 * @dev Implements ERC20Votes for checkpointing voting power. This allows users to delegate votes 
 * and ensures that voting power is tracked historically (snapshotting), preventing "flash loan" voting attacks.
 * @custom:security-note Max supply is capped at 1 Billion to prevent inflation abuse.
 * @author NexTechArchitect
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    
    /// @notice The absolute hard cap on token supply (1 Billion).
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// @notice The address authorized to mint new tokens (The Timelock).
    address public immutable GOVERNANCE_EXECUTOR;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the token and distributes the initial supply.
     * @param initialReceiver The address receiving the initial 150M tokens (e.g., Treasury or Founder).
     * @param governanceExecutor The Timelock address that will control future minting.
     */
    constructor(
        address initialReceiver,
        address governanceExecutor
    )
        ERC20("DISO Governance Token", "DISO")
        ERC20Permit("DISO Governance Token")
    {
        GOVERNANCE_EXECUTOR = governanceExecutor;
        _mint(initialReceiver, 150_000_000 * 10 ** 18);
    }

    /*//////////////////////////////////////////////////////////////
                                MINTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mints new tokens to a specific address.
     * @dev Restricted to the Governance Executor (Timelock). Enforces the Max Supply cap.
     * @param to The recipient address.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external {
        if (msg.sender != GOVERNANCE_EXECUTOR)
            revert GovernanceToken__NotGovernance();
        
        if (totalSupply() + amount > MAX_SUPPLY)
            revert GovernanceToken__MaxSupplyExceeded();
            
        _mint(to, amount);
    }

    /*//////////////////////////////////////////////////////////////
                               OVERRIDES
    //////////////////////////////////////////////////////////////*/

    // The following functions are overrides required by Solidity because 
    // we are inheriting from multiple OpenZeppelin modules.

    /**
     * @dev Updates the vote checkpoints when tokens are transferred.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /**
     * @dev Returns the current nonce for ERC20Permit signatures.
     */
    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}