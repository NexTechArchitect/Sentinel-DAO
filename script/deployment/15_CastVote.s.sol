// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {HybridGovernorDynamic} from "../../src/contracts/core/HybridGovernorDynamic.sol";

contract CastVote is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address govAddr = vm.envAddress("GOVERNOR_ADDRESS");

        vm.startBroadcast(pk);

        HybridGovernorDynamic governor = HybridGovernorDynamic(payable(govAddr));

        uint256 proposalId = 0x1b76eb5902ec7a14133b6c1cb06270a4827a1a17b2e679121edc212d5cd05455;

        uint8 state = uint8(governor.state(proposalId));
        console.log("Proposal State (Before Voting):", state);

        if (state == 1) { 
            console.log("Voting is OPEN. Casting Vote...");
            
            governor.castVote(proposalId, 1);
            
            console.log("VOTE CAST SUCCESSFULLY! (For)");
        } else {
            console.log("Voting is NOT Active yet. Current State:", state);
        }

        vm.stopBroadcast();
    }
}