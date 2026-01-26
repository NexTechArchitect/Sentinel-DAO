// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";

contract DeployCore is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address roleManager = vm.envAddress("ROLE_MANAGER_ADDRESS");
        address token = vm.envAddress("GOV_TOKEN_ADDRESS");

        vm.startBroadcast(pk);

        DAOCore core = new DAOCore(roleManager, token);

        vm.stopBroadcast();

        console.log("CORE_ADDRESS=%s", address(core));
    }
}