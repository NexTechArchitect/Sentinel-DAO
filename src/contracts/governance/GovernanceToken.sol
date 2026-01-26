// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {ZeroAddress} from "../errors/CommonErrors.sol";
import {NotGovernance, MaxSupplyExceeded} from "../errors/GovernanceErrors.sol";

/**
 * @title GovernanceToken (DISO)
 * @notice Native voting token with integrated gasless voting and governance acquisition hooks.
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes, ERC20Burnable {

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;
    
    address public immutable GOVERNANCE_EXECUTOR;
    address public governor;


    constructor(
        address initialReceiver,
        address _executor
    ) 
        ERC20("Diso Coin", "DISO") 
        ERC20Permit("Diso Coin") 
    {
        if (_executor == address(0)) revert ZeroAddress();

        GOVERNANCE_EXECUTOR = _executor;
        _mint(initialReceiver, 150_000_000 * 10 ** 18);
    }


    /**
     * @notice Updates the Governor contract address for acquisition hooks.
     * @param _governor The new Governor address.
     */
    function setGovernor(address _governor) external {
        if (msg.sender != GOVERNANCE_EXECUTOR) revert NotGovernance();
        if (_governor == address(0)) revert ZeroAddress();

        governor = _governor;
    }


    /**
     * @notice Mints new DISO tokens within the hard supply cap.
     * @dev Only callable by the Governance Executor (Timelock/DAO).
     */
    function mint(address to, uint256 amount) external {
        if (msg.sender != GOVERNANCE_EXECUTOR) revert NotGovernance();
        if (amount > MAX_SUPPLY - totalSupply()) revert MaxSupplyExceeded();

        _mint(to, amount);
    }


    /**
     * @dev Internal update hook for transfers, minting, and burning. 
     * Triggers a 'recordTokenAcquisition' call to the Governor to track voting age/reputation.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);

        if (to != address(0) && from != address(0) && governor != address(0)) {
            (bool success, ) = governor.call{gas: 30000}(
                abi.encodeWithSignature("recordTokenAcquisition(address)", to)
            );
            success; 
        }
    }


    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}