// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {RoleManager} from "../../src/contracts/security/RoleManager.sol";

contract DeployBase is Script {

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        RoleManager roleManager = new RoleManager(deployer);
        
        GovernanceToken token = new GovernanceToken(deployer, deployer);

        vm.stopBroadcast();

        console.log("ROLE_MANAGER_ADDRESS=%s", address(roleManager));
        console.log("GOV_TOKEN_ADDRESS=%s", address(token));
    }
}