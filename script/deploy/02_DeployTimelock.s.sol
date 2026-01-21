// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Deploy Timelock Script
 * @notice Deploys the TimelockController which acts as the owner of the DAO assets.
 * @dev Sets the minimum delay to 2 days.
 * - Proposers: EMPTY (Only Governor will be added later).
 * - Executors: PUBLIC (Anyone can execute after delay).
 */
contract DeployTimelock is Script {
    function run() external returns (TimelockController) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        address[] memory proposers = new address[](0);

        address[] memory executors = new address[](1);
        executors[0] = address(0);

        TimelockController timelock = new TimelockController(
            2 days, // minDelay
            proposers,
            executors,
            deployer
        );

        vm.stopBroadcast();

        console2.log("Timelock deployed at:", address(timelock));

        return timelock;
    }
}
