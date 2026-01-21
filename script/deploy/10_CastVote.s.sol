// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/core/HybridGovernorDynamic.sol";

contract CastVote is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address governor = vm.envAddress("GOVERNOR_ADDRESS");
        uint256 proposalId = vm.envUint("PROPOSAL_ID");

        vm.startBroadcast(deployerKey);

        // 0 = Against, 1 = For, 2 = Abstain
        // We vote 1 (For) to pass the proposal
        HybridGovernorDynamic(payable(governor)).castVote(proposalId, 1);

        console2.log("Voted FOR proposal:", proposalId);

        vm.stopBroadcast();
    }
}
