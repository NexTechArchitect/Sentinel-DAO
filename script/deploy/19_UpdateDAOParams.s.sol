// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/config/DAOConfig.sol";

contract UpdateDAOParams is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        address config = vm.envAddress("DAO_CONFIG_ADDRESS");

        vm.startBroadcast(key);

        DAOConfig(config).setVotingPeriod(60000);
        DAOConfig(config).setQuorumPercentage(6);

        vm.stopBroadcast();
    }
}
