// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

/**
 * @title Deploy DAO Configuration
 * @notice Deploys the centralized configuration contract for the DAO.
 * @dev Requires 'TIMELOCK_ADDRESS' to be set in the .env file.
 */
contract DeployDAOConfig is Script {
    function run() external returns (DAOConfig) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");

        // Configuration Parameters
        uint48 votingDelay = 1; // 1 block
        uint32 votingPeriod = 45818; // ~1 week (assuming 13s block time)
        uint16 quorumPercentage = 4; // 4%
        uint256 proposalThreshold = 0; // 0 Tokens required to propose

        vm.startBroadcast(deployerKey);

        DAOConfig config = new DAOConfig(
            timelock,
            votingDelay,
            votingPeriod,
            quorumPercentage,
            proposalThreshold
        );

        vm.stopBroadcast();

        console2.log("DAOConfig deployed at:", address(config));

        return config;
    }
}
