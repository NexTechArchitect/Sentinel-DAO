// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IUpgradeExecutor {
    event UpgradeExecuted(address indexed proxy, address indexed newImpl);

    function executeUpgrade(
        address proxy,
        address newImplementation,
        bytes calldata data
    ) external;

    function timelock() external view returns (address);
}
