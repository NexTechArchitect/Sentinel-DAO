// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../../src/contracts/security/RoleManager.sol";
import "../../src/contracts/security/EmergencyPause.sol";

/**
 * @title Deploy Security Contracts
 * @notice Deploys the RoleManager and EmergencyPause contracts for the DAO's security.
 * @dev The RoleManager is initialized with the deployer as the initial admin.
 */

contract DeploySecurity is Script {
    function run() external returns (RoleManager, EmergencyPause) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        address deployerAddress = vm.addr(deployerKey);
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");

        vm.startBroadcast(deployerKey);

        RoleManager roleManager = new RoleManager(deployerAddress);

        EmergencyPause emergencyPause = new EmergencyPause(
            address(roleManager)
        );

        vm.stopBroadcast();

        console2.log("RoleManager deployed at:", address(roleManager));
        console2.log("EmergencyPause deployed at:", address(emergencyPause));

        return (roleManager, emergencyPause);
    }
}
