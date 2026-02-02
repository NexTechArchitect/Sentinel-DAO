// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {DAOCore} from "../../src/contracts/core/DAOCore.sol";
import {DAOAccountFactory} from "../../src/contracts/aa/DAOAccountFactory.sol";
import {DAOPayMaster} from "../../src/contracts/aa/DAOPayMaster.sol";
import {SessionKeyModule} from "../../src/contracts/aa/SessionKeyModule.sol";

contract DeployAA is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        
        address ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;
        
        address coreAddr = 0xf4ffd6558454c60E50ef97799C3D69758CB68cf6;
        DAOCore core = DAOCore(coreAddr);

        vm.startBroadcast(pk);

        console.log("DEPLOYING AA MODULES (V2) ");

        DAOAccountFactory factory = new DAOAccountFactory(ENTRY_POINT);
        DAOPayMaster paymaster = new DAOPayMaster(ENTRY_POINT);
        SessionKeyModule sessionKeys = new SessionKeyModule();

        core.registerModule(keccak256("AA_FACTORY_V2"), address(factory));
        core.registerModule(keccak256("PAYMASTER_V2"), address(paymaster));
        core.registerModule(keccak256("SESSION_KEYS_V2"), address(sessionKeys));

        (bool success, ) = address(paymaster).call{value: 0.05 ether}("");
        require(success, "Funding failed");

        vm.stopBroadcast();

        console.log("AA_FACTORY_ADDRESS=%s", address(factory));
        console.log("PAYMASTER_ADDRESS=%s", address(paymaster));
        console.log("SESSION_KEYS_ADDRESS=%s", address(sessionKeys));
        console.log("--- AA DEPLOYMENT SUCCESS (V2) ---");
    }
}
