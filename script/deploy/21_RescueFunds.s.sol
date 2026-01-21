// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/core/DAOTreasury.sol";

contract RescueFunds is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        address treasuryAddr = vm.envAddress("TREASURY_ADDRESS");
        address receiverAddr = vm.envAddress("RESCUE_RECEIVER");

        vm.startBroadcast(key);

        DAOTreasury treasury = DAOTreasury(payable(treasuryAddr));

        uint256 balance = address(treasury).balance;

        require(balance > 0, "Treasury is empty, nothing to rescue");

        treasury.transferETH(payable(receiverAddr), balance);

        vm.stopBroadcast();
    }
}
