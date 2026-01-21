// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/*
 * DAOTimelock
 *
 * Timelock execution layer for DAO governance.
 *
 * This contract is responsible for executing all governance-approved
 * actions after a mandatory delay. It acts as the admin for critical
 * system components such as the treasury and upgradeable contracts.
 *
 * Design principles:
 * - Governance (HybridGovernor) decides
 * - Timelock executes after delay
 * - No direct execution power to the Governor
 *
 * Built on OpenZeppelin TimelockController.
 */

import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract DAOTimelock is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
