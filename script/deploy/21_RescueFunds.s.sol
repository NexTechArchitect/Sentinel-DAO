// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/core/DAOTreasury.sol";

contract RescueFunds is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address receiver = vm.envAddress("RESCUE_RECEIVER");

        vm.startBroadcast(key);

        DAOTreasury(treasury).rescueETH(receiver);

        vm.stopBroadcast();
    }
}
