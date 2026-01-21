// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../../src/contracts/core/HybridGovernorDynamic.sol";
import "../../src/contracts/core/DAOTreasury.sol";

contract CancelProposal is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        address governor = vm.envAddress("GOVERNOR_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address receiver = vm.envAddress("PROPOSAL_RECEIVER");

        vm.startBroadcast(deployerKey);

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = treasury;
        values[0] = 0;

        calldatas[0] = abi.encodeWithSelector(
            DAOTreasury.transferETH.selector,
            payable(receiver),
            2 ether
        );

        bytes32 descriptionHash = keccak256(
            bytes("Send 2 ETH from DAO Treasury")
        );

        HybridGovernorDynamic(payable(governor)).cancel(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        vm.stopBroadcast();
    }
}
