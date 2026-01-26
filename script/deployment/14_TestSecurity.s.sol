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

        console.log("--- PHASE 13: SECURITY DRILL ---");

        // 1. Grant GUARDIAN_ROLE to Deployer (Admin can do this)
        // We need this because only Guardians can pause
        bytes32 guardianRole = roleManager.GUARDIAN_ROLE();
        if (!roleManager.hasRole(guardianRole, deployer)) {
            roleManager.grantRole(guardianRole, deployer);
            console.log("Granted GUARDIAN_ROLE to Deployer");
        }

        // 2. Check Initial State
        console.log("Current Pause State:", pauseContract.isPaused());

        // 3. EXECUTE PAUSE
        console.log(">>> Pushing Red Button (PAUSE)...");
        pauseContract.pause();
        
        // Verify
        require(pauseContract.isPaused() == true, "Security Failure: Contract did not pause!");
        console.log(" SYSTEM PAUSED SUCCESSFULLY");

        // 4. EXECUTE UNPAUSE (Resetting system)
        console.log(">>> Releasing Red Button (UNPAUSE)...");
        pauseContract.unpause();

        // Verify
        require(pauseContract.isPaused() == false, "Security Failure: Contract did not unpause!");
        console.log(" SYSTEM RESTORED TO NORMAL");

        vm.stopBroadcast();
        console.log("-----------------------------------");
        console.log("SECURITY DRILL PASSED ");
        console.log("-----------------------------------");
    }
}