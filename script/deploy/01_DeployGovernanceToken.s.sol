// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {GovernanceToken} from "../../src/contracts/core/GovernanceToken.sol";

/**
 * @title Deploy Governance Token Script
 * @notice Deploys the ERC20Votes governance token for the DAO.
 * @dev The deployer receives the initial supply and minting rights temporarily.
 */
contract DeployGovernanceToken is Script {
    function run() external returns (GovernanceToken token) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        token = new GovernanceToken(deployer, deployer);

        vm.stopBroadcast();

        console2.log("GovernanceToken deployed at:", address(token));
        console2.log("Initial Owner:", deployer);
    }
}
