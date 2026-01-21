// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";

contract UpgradeProtocol is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(key);

        // upgrade execution happens via timelock proposal
        // logic executed by UpgradeExecutor contract

        vm.stopBroadcast();
    }
}
