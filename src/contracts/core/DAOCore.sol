// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {RoleManager} from "../security/RoleManager.sol";
import {GovernanceToken} from "../governance/GovernanceToken.sol";
import {ZeroAddress, Unauthorized} from "../errors/CommonErrors.sol";

/**
 * @title DAOCore
 * @notice Central registry and orchestration layer for the DAO ecosystem.
 */
contract DAOCore {
    RoleManager public immutable ROLE_MANAGER;
    GovernanceToken public immutable TOKEN;

    error AlreadyLocked();
    error ModuleAlreadyExists();

    address public governor;
    address public treasury;
    address public timelock;

    mapping(bytes32 => address) public modules;

    event ModuleLinked(bytes32 indexed moduleKey, address indexed moduleAddress);
    event SystemLinked(address governor, address treasury, address timelock);
    event SetupLocked(address indexed admin, uint256 timestamp);

    bool private _locked;

    constructor(address _roleManager, address _token) {
        if (_roleManager == address(0)) revert ZeroAddress();
        if (_token == address(0)) revert ZeroAddress();
        ROLE_MANAGER = RoleManager(_roleManager);
        TOKEN = GovernanceToken(_token);
    }

    function linkCoreModules(
        address _governor,
        address _treasury,
        address _timelock
    ) external {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender))
            revert Unauthorized();
        if (_locked) revert AlreadyLocked();
        if (_governor == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_timelock == address(0)) revert ZeroAddress();

        governor = _governor;
        treasury = _treasury;
        timelock = _timelock;

        emit SystemLinked(_governor, _treasury, _timelock);
    }

    /**
     * @notice Allows the admin to add additional functional modules to the DAO registry.
     * @param moduleKey Keccak256 hash or bytes32 identifier of the module.
     * @param moduleAddress Contract address of the module.
     */
    function registerModule(bytes32 moduleKey, address moduleAddress) external {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender))
            revert Unauthorized();
        if (moduleAddress == address(0)) revert ZeroAddress();
        if (modules[moduleKey] != address(0)) revert ModuleAlreadyExists();

        modules[moduleKey] = moduleAddress;
        emit ModuleLinked(moduleKey, moduleAddress);
    }

    /**
     * @notice Permanently locks the core system addresses to prevent further changes.
     * @dev Use with caution as this action is irreversible.
     */
    function lockSetup() external {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender))
            revert Unauthorized();
        _locked = true;
        emit SetupLocked(msg.sender, block.timestamp);
    }

    function getModule(bytes32 moduleKey) external view returns (address) {
        return modules[moduleKey];
    }
}