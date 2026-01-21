// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/*//////////////////////////////////////////////////////////////
                        GOVERNANCE  ERRORS
 //////////////////////////////////////////////////////////////*/
// DAO Core errors
error OnlyTimelock();
error InvalidAddress();
error ModuleAlreadyExists();
error ModuleNotFound();
error SameAddress();

// Governance Token errors
error GovernanceToken__NotGovernance();
error GovernanceToken__MaxSupplyExceeded();
