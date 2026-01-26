// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {HybridGovernorDynamic} from "../../src/contracts/core/HybridGovernorDynamic.sol";
import {VetoCouncil} from "../../src/contracts/governance/VetoCouncil.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

contract DeployGovernance is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        
        address token = vm.envAddress("GOV_TOKEN_ADDRESS");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address config = vm.envAddress("CONFIG_ADDRESS");
        address roleManager = vm.envAddress("ROLE_MANAGER_ADDRESS");

        vm.startBroadcast(pk);

        uint256 deployerNonce = vm.getNonce(deployer);
        address predictedGovernor = vm.computeCreateAddress(deployer, deployerNonce + 1);

        //  Deploy Veto Council
        VetoCouncil veto = new VetoCouncil(roleManager, predictedGovernor);

        //  Deploy Governor
        HybridGovernorDynamic governor = new HybridGovernorDynamic(
            GovernanceToken(token),
            DAOTimelock(payable(timelock)),
            DAOConfig(config),
            address(veto),
            4 
        );

        require(address(governor) == predictedGovernor, "Prediction Mismatch");

        vm.stopBroadcast();

        console.log("VETO_COUNCIL_ADDRESS=%s", address(veto));
        console.log("GOVERNOR_ADDRESS=%s", address(governor));
    }
}