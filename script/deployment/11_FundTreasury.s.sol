// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";

contract FundTreasury is Script {

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        
        address tokenAddr = vm.envAddress("GOV_TOKEN_ADDRESS");
        address treasuryAddr = vm.envAddress("TREASURY_ADDRESS");


        vm.startBroadcast(pk);

        GovernanceToken token = GovernanceToken(tokenAddr);
        uint256 amount = 50_000_000 * 10**18;

        bool success = token.transfer(treasuryAddr, amount);
        require(success, "Transfer failed");

        
        console.log("Transferred", amount, "DISO to Treasury");
        console.log("Treasury Balance:", token.balanceOf(treasuryAddr));

        vm.stopBroadcast();


        console.log("TREASURY FUNDED ");
    }
}