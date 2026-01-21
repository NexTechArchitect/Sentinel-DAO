// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IUpgradeExecutor {
    function executeUpgrade(
        address proxy,
        address newImplementation,
        bytes calldata data
    ) external;
}
