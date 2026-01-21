// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";
import {GovernanceToken} from "../../src/contracts/core/GovernanceToken.sol";

contract WireDAO is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address timelockAddr = vm.envAddress("TIMELOCK_ADDRESS");
        address governorAddr = vm.envAddress("GOVERNOR_ADDRESS");
        address tokenAddr = vm.envAddress("GOV_TOKEN_ADDRESS");
        address roleManagerAddr = vm.envAddress("ROLE_MANAGER_ADDRESS");

        vm.startBroadcast(deployerKey);

        TimelockController timelock = TimelockController(payable(timelockAddr));
        RoleManager roleManager = RoleManager(roleManagerAddr);
        GovernanceToken token = GovernanceToken(tokenAddr);

        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();
        bytes32 guardianRole = keccak256("GUARDIAN_ROLE");

        timelock.grantRole(proposerRole, governorAddr);
        timelock.grantRole(executorRole, address(0));

        roleManager.grantRole(guardianRole, deployer);
        roleManager.grantRole(guardianRole, timelockAddr);

        token.delegate(deployer);

        roleManager.transferAdmin(timelockAddr);

        // timelock.renounceRole(adminRole, deployer);

        vm.stopBroadcast();

        console2.log("DAO Wiring Complete");
        console2.log("Governor Proposer Role Granted");
        console2.log("Executor Role Opened");
        console2.log("Guardian Roles Assigned");
        console2.log("RoleManager Ownership Transferred");
    }
}
