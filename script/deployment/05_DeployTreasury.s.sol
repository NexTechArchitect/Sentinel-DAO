// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";
import {TreasuryYieldStrategy} from "../../src/contracts/core/TreasuryYieldStrategy.sol";

contract DeployTreasury is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address roleManager = vm.envAddress("ROLE_MANAGER_ADDRESS");

        // Real Aave V3 Pool Address on Sepolia
        address aavePool = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;

        vm.startBroadcast(pk);

        DAOTreasury treasury = new DAOTreasury(timelock);

        TreasuryYieldStrategy strategy = new TreasuryYieldStrategy(
            aavePool,
            roleManager,
            address(treasury)
        );

        vm.stopBroadcast();

        console.log("TREASURY_ADDRESS=%s", address(treasury));
        console.log("YIELD_STRATEGY_ADDRESS=%s", address(strategy));
    }
}