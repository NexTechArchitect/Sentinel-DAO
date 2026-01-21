// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/core/DAOCore.sol";

contract RemoveModule is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        address daoCore = vm.envAddress("DAOCORE_ADDRESS");
        bytes32 moduleId = keccak256("STAKING_MODULE");

        vm.startBroadcast(key);

        DAOCore(daoCore).removeModule(moduleId);

        vm.stopBroadcast();
    }
}
