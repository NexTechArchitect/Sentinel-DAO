// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {QuadraticFunding} from "../../src/contracts/governance/QuadraticFunding.sol";
import {ConvictionVoting} from "../../src/contracts/governance/ConvictionVoting.sol";
import {ConvictionStaking} from "../../src/contracts/governance/ConvictionStaking.sol";
import {DelegationRegistry} from "../../src/contracts/delegation/DelegationRegistry.sol";

contract DeployAdvancedVoting is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address token = vm.envAddress("GOV_TOKEN_ADDRESS");
        address roleManager = vm.envAddress("ROLE_MANAGER_ADDRESS");

        vm.startBroadcast(pk);

        QuadraticFunding qf = new QuadraticFunding(roleManager, token);
        
        ConvictionVoting cv = new ConvictionVoting(token, roleManager);
        
        ConvictionStaking cs = new ConvictionStaking(token);
        
        DelegationRegistry delReg = new DelegationRegistry("DAO Delegation", "1");

        vm.stopBroadcast();

        console.log("QF_ADDRESS=%s", address(qf));
        console.log("CONVICTION_VOTING_ADDRESS=%s", address(cv));
        console.log("CONVICTION_STAKING_ADDRESS=%s", address(cs));
        console.log("DELEGATION_REGISTRY_ADDRESS=%s", address(delReg));
    }
}