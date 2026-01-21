// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";

contract DeployCore is Script {
    function run() external returns (DAOCore) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        address governor = vm.envAddress("GOVERNOR_ADDRESS");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast(deployerKey);

        DAOCore core = new DAOCore(governor, timelock, treasury);

        vm.stopBroadcast();

        console2.log("DAOCore deployed at:", address(core));

        return core;
    }
}
