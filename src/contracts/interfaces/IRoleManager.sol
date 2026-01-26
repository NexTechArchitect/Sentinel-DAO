
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title Role Manager Interface
 * @notice Interface to decouple EmergencyPause from the actual RoleManager logic.
 */
interface IRoleManager {
   
    function GUARDIAN_ROLE() external view returns (bytes32);

   
    function hasRole(bytes32 role, address account) external view returns (bool);
}