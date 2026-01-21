// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

/**
 * @title Deploy DAO Treasury
 * @notice Deploys the DAOTreasury contract which will hold and manage the DAO's funds.
 * @dev The treasury is owned by the Timelock to ensure governance control over fund management.
 */

import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";

contract DeployTreasury is Script {
    function run() external returns (DAOTreasury) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        // Treasury must be owned by Timelock
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");

        vm.startBroadcast(deployerKey);

        DAOTreasury treasury = new DAOTreasury(timelock);

        vm.stopBroadcast();

        console2.log("Treasury deployed at:", address(treasury));

        return treasury;
    }
}
