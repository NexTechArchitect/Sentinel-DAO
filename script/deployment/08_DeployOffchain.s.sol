// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {OffchainResultExecutor} from "../../src/contracts/offchain/OffchainResultExecutor.sol";
import {VotingPowerSnapshot} from "../../src/contracts/offchain/VotingPowerSnapshot.sol";

contract DeployOffchain is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address governor = vm.envAddress("GOVERNOR_ADDRESS");

        vm.startBroadcast(pk);

        OffchainResultExecutor offExecutor = new OffchainResultExecutor(
            timelock,
            deployer, 
            "DAO Offchain Voting",
            "1"
        );

        VotingPowerSnapshot snapshot = new VotingPowerSnapshot(governor, timelock);

        vm.stopBroadcast();

        console.log("OFFCHAIN_EXECUTOR_ADDRESS=%s", address(offExecutor));
        console.log("VOTING_SNAPSHOT_ADDRESS=%s", address(snapshot));
    }
}