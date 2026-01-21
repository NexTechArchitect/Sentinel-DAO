// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {
    OnlyAdmin,
    ZeroAddress,
    RoleNotGranted,
    RoleAlreadyGranted
} from "../errors/SecurityErrors.sol";

/**
 * @title Role Manager (ACL)
 * @notice The centralized registry for managing permissions across the DAO ecosystem.
 * @dev Implements a Role-Based Access Control (RBAC) system. Instead of hardcoding addresses
 * in individual contracts, other contracts query this registry to check if a user has permission.
 * @custom:security-note The 'admin' is the Super-User (usually the Timelock) who manages these keys.
 * @author NexTechArchitect
 */
contract RoleManager {
    /*/////////////////////////////////////////////////
                         EVENTS
    /////////////////////////////////////////////////*/
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    /*//////////////////////////////////////////////
                         STORAGE
    //////////////////////////////////////////////*/

    /// @notice The super-admin address (The DAO Timelock).
    address public admin;

    /// @dev Mapping of Role Hash => User Address => IsGranted
    mapping(bytes32 => mapping(address => bool)) private roles;

    /*/////////////////////////////////////////////////
                      ROLE CONSTANTS
    /////////////////////////////////////////////////*/

    // Cryptographic hashes for the various system roles
    bytes32 public constant ROLE_GOVERNANCE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant ROLE_TIMELOCK = keccak256("TIMELOCK_ROLE");
    bytes32 public constant ROLE_TREASURY = keccak256("TREASURY_ROLE");
    bytes32 public constant ROLE_UPGRADE = keccak256("UPGRADE_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /*/////////////////////////////////////////////////
                        MODIFIERS
    /////////////////////////////////////////////////*/

    /**
     * @dev Restricts access to the global admin (Timelock).
     */
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    /*/////////////////////////////////////////////////
                       CONSTRUCTOR
    /////////////////////////////////////////////////*/

    /**
     * @notice Initializes the access control system.
     * @param _admin The initial super-user (usually the deployer, then transferred to Timelock).
     */
    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    /*/////////////////////////////////////////////////
                    ROLE MANAGEMENT
    /////////////////////////////////////////////////*/

    /**
     * @notice Assigns a specific permission role to an account.
     * @dev Only callable by the Admin.
     * @param role The cryptographic hash of the role (e.g., keccak256("GUARDIAN_ROLE")).
     * @param account The address receiving the permission.
     */
    function grantRole(bytes32 role, address account) external onlyAdmin {
        if (account == address(0)) revert ZeroAddress();

        // Check redundancy (optional, but good for gas/clean logs)
        if (roles[role][account]) revert RoleAlreadyGranted();

        roles[role][account] = true;
        emit RoleGranted(role, account);
    }

    /**
     * @notice Removes a permission role from an account.
     * @dev Only callable by the Admin.
     * @param role The cryptographic hash of the role.
     * @param account The address losing the permission.
     */
    function revokeRole(bytes32 role, address account) external onlyAdmin {
        if (!roles[role][account]) revert RoleNotGranted();

        roles[role][account] = false;
        emit RoleRevoked(role, account);
    }

    /**
     * @notice Checks if an account holds a specific role.
     * @dev Used by external contracts (like EmergencyPause) to verify permissions.
     * @param role The role hash to check.
     * @param account The user address.
     * @return True if the user has the role, False otherwise.
     */
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool) {
        return roles[role][account];
    }

    /*///////////////////////////////////////////////
                    ADMIN MANAGEMENT
    ///////////////////////////////////////////////*/

    /**
     * @notice Rotates the Super-Admin of the DAO.
     * @dev Critical function. If this is set to an invalid address,
     * the entire permission system becomes immutable (bricked).
     * @param newAdmin The address of the new admin (usually the Governance Timelock).
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();

        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminTransferred(oldAdmin, newAdmin);
    }
}
