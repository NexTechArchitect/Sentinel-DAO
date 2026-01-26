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

        // Proposal ID from previous step
        uint256 proposalId = 63100912279725926203215066636664161875071706850575840366514770416229412593965;

        // Check State before voting
        // 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
        uint8 state = uint8(governor.state(proposalId));
        console.log("Proposal State (Before Voting):", state);

        if (state == 1) { // 1 means Active
            console.log("Voting is OPEN. Casting Vote...");
            
            // Cast Vote: 0=Against, 1=For, 2=Abstain
            governor.castVote(proposalId, 1);
            
            console.log(" Vote Cast: FOR");
        } else {
            console.log(" Voting is NOT Active yet. Current State:", state);
            console.log("Try mining more blocks or increasing time.");
        }

        vm.stopBroadcast();
    }
}