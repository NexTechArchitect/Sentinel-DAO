// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {EmergencyPause} from "../../src/contracts/security/EmergencyPause.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";

contract TestSecurity is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address pauseAddr = vm.envAddress("EMERGENCY_PAUSE_ADDRESS");
        address roleAddr = vm.envAddress("ROLE_MANAGER_ADDRESS");

        vm.startBroadcast(pk);

        EmergencyPause pauseContract = EmergencyPause(pauseAddr);
        RoleManager roleManager = RoleManager(roleAddr);

        console.log("  SECURITY CHECK ");

        bytes32 guardianRole = roleManager.GUARDIAN_ROLE();
        if (!roleManager.hasRole(guardianRole, deployer)) {
            roleManager.grantRole(guardianRole, deployer);
            console.log("Granted GUARDIAN_ROLE to Deployer");
        }

        // Check Initial State
        console.log("Current Pause State:", pauseContract.isPaused());

        // EXECUTE PAUSE
        console.log(">>> Pushing Red Button (PAUSE)...");
        pauseContract.pause();
        
        // Verify
        require(pauseContract.isPaused() == true, "Security Failure: Contract did not pause!");
        console.log(" SYSTEM PAUSED SUCCESSFULLY");

        // EXECUTE UNPAUSE (Resetting system)
        console.log(">>> Releasing Red Button (UNPAUSE)...");
        pauseContract.unpause();

        // Verify
        require(pauseContract.isPaused() == false, "Security Failure: Contract did not unpause!");
        console.log(" SYSTEM RESTORED TO NORMAL");

        vm.stopBroadcast();
        console.log("SECURITY DRILL PASSED ");
    }
}
