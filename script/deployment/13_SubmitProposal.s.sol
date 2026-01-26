// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {HybridGovernorDynamic} from "../../src/contracts/core/HybridGovernorDynamic.sol";

contract SubmitProposal is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        
        address govAddr = vm.envAddress("GOVERNOR_ADDRESS");
        address tokenAddr = vm.envAddress("GOV_TOKEN_ADDRESS");
        address treasuryAddr = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast(pk);

        HybridGovernorDynamic governor = HybridGovernorDynamic(payable(govAddr));

        address[] memory targets = new address[](1);
        targets[0] = treasuryAddr;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transferERC20(address,address,uint256)", 
            tokenAddr, 
            address(0x1234567890123456789012345678901234567890), 
            100 * 10**18
        );

        string memory description = "Proposal #1: Send 100 DISO to Random User. This proposal intends to verify the end-to-end functionality of the DAO treasury transfer mechanism. We are testing the governance flow, voting power verification, and execution capabilities on the local sepolia chain.";

        console.log("Submitting Proposal at Block:", block.number);
        console.log("Description Length:", bytes(description).length);
        
        uint256 pid = governor.propose(targets, values, calldatas, description);

        console.log("PROPOSAL CREATED SUCCESSFULLY!");
        console.log("Proposal ID:", pid);
      
        vm.stopBroadcast();
    }
}