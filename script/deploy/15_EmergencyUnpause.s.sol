// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/security/EmergencyPause.sol";

contract EmergencyUnpause is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address emergencyPause = vm.envAddress("EMERGENCY_PAUSE_ADDRESS");

        vm.startBroadcast(deployerKey);

        // Call the unpause function
        EmergencyPause(emergencyPause).unpause();

        vm.stopBroadcast();
    }
}
