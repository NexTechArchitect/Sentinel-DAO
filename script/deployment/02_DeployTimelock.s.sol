// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";
import {UpgradeExecutor} from "../../src/contracts/upgrades/UpgradeExecutor.sol";

contract DeployTimelock is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address roleManager = vm.envAddress("ROLE_MANAGER_ADDRESS");

        vm.startBroadcast(pk);

        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        
        proposers[0] = deployer;
        executors[0] = deployer;

        DAOTimelock timelock = new DAOTimelock(0, proposers, executors, deployer);
        
        UpgradeExecutor upgradeExec = new UpgradeExecutor(roleManager);

        vm.stopBroadcast();

        console.log("TIMELOCK_ADDRESS=%s", address(timelock));
        console.log("UPGRADE_EXEC_ADDRESS=%s", address(upgradeExec));
    }
}