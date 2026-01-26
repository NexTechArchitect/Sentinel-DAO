// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";
import {DAOTimelock} from "../../src/contracts/core/DAOTimelock.sol";
import {GovernanceToken} from "../../src/contracts/governance/GovernanceToken.sol";
import {DAOTreasury} from "../../src/contracts/core/DAOTreasury.sol";

contract WireDAO is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        
        // Initialize Contract Instances
        DAOCore core = DAOCore(vm.envAddress("CORE_ADDRESS"));
        DAOTimelock timelock = DAOTimelock(payable(vm.envAddress("TIMELOCK_ADDRESS")));
        DAOTreasury treasury = DAOTreasury(payable(vm.envAddress("TREASURY_ADDRESS")));
        GovernanceToken token = GovernanceToken(vm.envAddress("GOV_TOKEN_ADDRESS"));

        vm.startBroadcast(pk);

        core.linkCoreModules(
            vm.envAddress("GOVERNOR_ADDRESS"), 
            address(treasury), 
            address(timelock)
        );
        
        core.registerModule(keccak256("QF"), vm.envAddress("QF_ADDRESS"));
        core.registerModule(keccak256("RAGEQUIT"), vm.envAddress("RAGE_QUIT_ADDRESS"));
        core.registerModule(keccak256("ANALYTICS"), vm.envAddress("GOV_ANALYTICS_ADDRESS"));
        core.registerModule(keccak256("CONVICTION"), vm.envAddress("CONVICTION_VOTING_ADDRESS"));
        core.registerModule(keccak256("STAKING"), vm.envAddress("CONVICTION_STAKING_ADDRESS"));

        core.lockSetup();

        timelock.grantRole(timelock.PROPOSER_ROLE(), vm.envAddress("GOVERNOR_ADDRESS"));
        timelock.grantRole(timelock.CANCELLER_ROLE(), vm.envAddress("GOVERNOR_ADDRESS"));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));

        token.setGovernor(address(timelock));

        bytes memory payload = abi.encodeWithSignature(
            "setRageQuitContract(address)", 
            vm.envAddress("RAGE_QUIT_ADDRESS")
        );
        
        timelock.schedule(address(treasury), 0, payload, bytes32(0), bytes32(0), 0);
        timelock.execute(address(treasury), 0, payload, bytes32(0), bytes32(0));

        vm.stopBroadcast();

        console.log("DAO WIRED SUCCESSFULLY");
    }
}