// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";

import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";

import {
    HybridGovernorDynamic
} from "../../src/contracts/core/HybridGovernorDynamic.sol";

import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

/**
 * @title Deploy Hybrid Governor Script
 * @notice Deploys the HybridGovernorDynamic contract which manages the DAO's governance process.
 * and requires the addresses of the governance token, timelock, and DAO configuration.
 */

contract DeployHybridGovernor is Script {
    function run() external returns (HybridGovernorDynamic) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        address tokenAddr = vm.envAddress("GOV_TOKEN_ADDRESS");
        address timelockAddr = vm.envAddress("TIMELOCK_ADDRESS");
        address configAddr = vm.envAddress("DAO_CONFIG_ADDRESS");

        vm.startBroadcast(deployerKey);

        HybridGovernorDynamic governor = new HybridGovernorDynamic(
            IVotes(tokenAddr),
            TimelockController(payable(timelockAddr)),
            DAOConfig(configAddr)
        );

        vm.stopBroadcast();

        console2.log("HybridGovernorDynamic deployed at:", address(governor));

        return governor;
    }
}
