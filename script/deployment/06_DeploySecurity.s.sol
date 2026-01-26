// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {RageQuit} from "../../src/contracts/governance/RageQuit.sol";
import {ProposalGuard} from "../../src/contracts/governance/ProposalGuard.sol";
import {EmergencyPause} from "../../src/contracts/security/EmergencyPause.sol";
import {GovernanceAnalytics} from "../../src/contracts/security/GovernanceAnalytics.sol";

contract DeploySecurity is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        
        address token = vm.envAddress("GOV_TOKEN_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address governor = vm.envAddress("GOVERNOR_ADDRESS");
        address roleManager = vm.envAddress("ROLE_MANAGER_ADDRESS");

        vm.startBroadcast(pk);

        RageQuit rageQuit = new RageQuit(token, treasury);
        
        ProposalGuard guard = new ProposalGuard(governor);
        
        EmergencyPause pause = new EmergencyPause(roleManager);
        
        GovernanceAnalytics analytics = new GovernanceAnalytics(governor, token);

        vm.stopBroadcast();

        console.log("RAGE_QUIT_ADDRESS=%s", address(rageQuit));
        console.log("PROPOSAL_GUARD_ADDRESS=%s", address(guard));
        console.log("EMERGENCY_PAUSE_ADDRESS=%s", address(pause));
        console.log("GOV_ANALYTICS_ADDRESS=%s", address(analytics));
    }
}