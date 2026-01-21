// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {
    OnlyTimelock,
    InvalidAddress,
    ModuleAlreadyExists,
    ModuleNotFound,
    SameAddress
} from "../errors/GovernanceErrors.sol";

/**
 * @title Core DAO Registry
 * @notice The central nervous system of the DAO Architecture.
 * @dev Acts as the source of truth for the active Governor, Timelock, and Treasury addresses.
 * Also manages the registry of pluggable modules (extensions).
 * @author NexTechArchitect
 */
contract DAOCore {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event GovernorUpdated(
        address indexed oldGovernor,
        address indexed newGovernor
    );
    event TimelockUpdated(
        address indexed oldTimelock,
        address indexed newTimelock
    );
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event ModuleRegistered(bytes32 indexed moduleId, address indexed module);
    event ModuleRemoved(bytes32 indexed moduleId);

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/
    address public governor;
    address public timelock;
    address public treasury;

    mapping(bytes32 => address) private modules;

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the Core registry with the foundational contracts.
     * @param _governor The address of the Governance logic contract.
     * @param _timelock The address of the Timelock controller (The Owner).
     * @param _treasury The address of the Treasury/Vault contract.
     */
    constructor(address _governor, address _timelock, address _treasury) {
        if (_governor == address(0)) revert InvalidAddress();
        if (_timelock == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();

        governor = _governor;
        timelock = _timelock;
        treasury = _treasury;
    }

    /*//////////////////////////////////////////////////////////////
                           CORE ADDRESS UPDATES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Rotates the Governor contract address.
     * @dev Used when upgrading the governance voting logic (e.g., moving to a new standard).
     * @param newGovernor The address of the new Governor contract.
     */
    function updateGovernor(address newGovernor) external onlyTimelock {
        if (newGovernor == address(0)) revert InvalidAddress();
        if (newGovernor == governor) revert SameAddress();
        
        address old = governor;
        governor = newGovernor;
        
        emit GovernorUpdated(old, newGovernor);
    }

    /**
     * @notice Rotates the Timelock controller address.
     * @dev CRITICAL: This changes the 'Owner' of the system. 
     * If set incorrectly, the DAO could become immutable (bricked).
     * @param newTimelock The address of the new Timelock contract.
     */
    function updateTimelock(address newTimelock) external onlyTimelock {
        if (newTimelock == address(0)) revert InvalidAddress();
        if (newTimelock == timelock) revert SameAddress();

        address old = timelock;
        timelock = newTimelock;
        
        emit TimelockUpdated(old, newTimelock);
    }

    /**
     * @notice Rotates the Treasury contract address.
     * @dev Points the DAO to a new vault or asset manager.
     * @param newTreasury The address of the new Treasury contract.
     */
    function updateTreasury(address newTreasury) external onlyTimelock {
        if (newTreasury == address(0)) revert InvalidAddress();
        if (newTreasury == treasury) revert SameAddress();

        address old = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(old, newTreasury);
    }

    /*//////////////////////////////////////////////////////////////
                            MODULE SYSTEM
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Registers a new extension module to the DAO.
     * @dev Modules can be looked up by their bytes32 ID. Reverts if ID exists.
     * @param moduleId The unique identifier for the module (e.g., keccak256("DEFI_ADAPTER")).
     * @param module The address of the module contract.
     */
    function registerModule(
        bytes32 moduleId,
        address module
    ) external onlyTimelock {
        if (module == address(0)) revert InvalidAddress();
        if (modules[moduleId] != address(0)) revert ModuleAlreadyExists();

        modules[moduleId] = module;
        emit ModuleRegistered(moduleId, module);
    }

    /**
     * @notice Removes a module from the registry.
     * @dev Does not destroy the module contract, simply unlinks it from Core.
     * @param moduleId The unique identifier of the module to remove.
     */
    function removeModule(bytes32 moduleId) external onlyTimelock {
        if (modules[moduleId] == address(0)) revert ModuleNotFound();

        delete modules[moduleId];
        emit ModuleRemoved(moduleId);
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Retrieves the address of a registered module.
     * @param moduleId The unique identifier of the module.
     * @return The address of the module, or address(0) if not found.
     */
    function getModule(bytes32 moduleId) external view returns (address) {
        return modules[moduleId];
    }
}