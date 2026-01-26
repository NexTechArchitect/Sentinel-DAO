// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";

contract DelegateOnly is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address tokenAddr = vm.envAddress("GOV_TOKEN_ADDRESS");

        console.log("DELEGATING VOTES");
        vm.startBroadcast(pk);

        GovernanceToken token = GovernanceToken(tokenAddr);

        token.delegate(deployer);

        vm.stopBroadcast();
        
        console.log("Delegated successfully. Current Votes:", token.getVotes(deployer));
    }
}