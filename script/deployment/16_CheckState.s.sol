// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {HybridGovernorDynamic} from "../../src/contracts/core/HybridGovernorDynamic.sol";

contract CheckState is Script {
    // Added 'view' keyword here to remove warning
    function run() external view {
        address govAddr = vm.envAddress("GOVERNOR_ADDRESS");
        HybridGovernorDynamic governor = HybridGovernorDynamic(payable(govAddr));

        // Same Proposal ID
        uint256 proposalId = 63100912279725926203215066636664161875071706850575840366514770416229412593965;

        console.log("--- FINAL SCOREBOARD ---");
        
        // 1. Check Status
        console.log("Current State:", uint8(governor.state(proposalId)));

        // 2. Check Votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        
        console.log("Votes FOR:    ", forVotes);
        console.log("Votes AGAINST:", againstVotes);
        console.log("Votes ABSTAIN:", abstainVotes);

        console.log("------------------------");
        if (forVotes > 0) {
            console.log("SUCCESS: Votes are recorded on-chain!");
        }
    }
}