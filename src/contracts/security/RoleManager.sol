// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ZeroAddress, ArrayLengthMismatch} from "../errors/CommonErrors.sol";

/**
 * @title Role Manager (RBAC)
 * @notice Centralized Role-Based Access Control for the DAO.
 * @dev Optimized by removing Enumerable extensions to save gas on permission updates.
 * @author NexTechArchitect
 */
contract RoleManager is AccessControl {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    constructor(address rootAdmin) {
        if (rootAdmin == address(0)) revert ZeroAddress();

        
        _grantRole(DEFAULT_ADMIN_ROLE, rootAdmin);
        _grantRole(ADMIN_ROLE, rootAdmin);

        _setRoleAdmin(GUARDIAN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(EXECUTOR_ROLE, ADMIN_ROLE);
    }


    /**
     * @notice Grants multiple roles to multiple accounts in one transaction.
     */
    function grantRoleBatch(

        bytes32[] calldata rolesList,
        address[] calldata accounts

    ) external onlyRole(ADMIN_ROLE) {
        
        uint256 len = rolesList.length;
        if (len != accounts.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < len; ) {
            if (accounts[i] == address(0)) revert ZeroAddress();
            _grantRole(rolesList[i], accounts[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Revokes multiple roles from multiple accounts in one transaction.
     * @dev Crucial for emergency response (stripping hacked wallets of access).
     */
    function revokeRoleBatch(

        bytes32[] calldata rolesList,
        address[] calldata accounts
    
    ) external onlyRole(ADMIN_ROLE) {
    
        uint256 len = rolesList.length;
        if (len != accounts.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < len; ) {
            _revokeRole(rolesList[i], accounts[i]);
            unchecked { ++i; }
        }
    }

    
    function isGuardian(address account) external view returns (bool) {
        return hasRole(GUARDIAN_ROLE, account);
    }

    function isExecutor(address account) external view returns (bool) {
        return hasRole(EXECUTOR_ROLE, account);
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }
}