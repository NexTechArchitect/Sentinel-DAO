// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";

contract FundTreasury is Script {
    function run() external payable {
        uint256 key = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast(key);

        payable(treasury).transfer(5 ether);

        vm.stopBroadcast();
    }
}
