// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

contract DeployConfig is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");

        vm.startBroadcast(pk);

        // Param 1: Timelock Address
        // Param 2: Voting Delay (1 Hour = 3600s)
        // Param 3: Voting Period (1 Day = 86400s)
        // Param 4: Proposal Threshold (1000 Tokens)
        // Param 5: Quorum Percentage (4%)
        DAOConfig config = new DAOConfig(
            timelock,
            3600,
            86400,
            1000 * 10**18,
            4
        );

        vm.stopBroadcast();

        console.log("CONFIG_ADDRESS=%s", address(config));
    }
}