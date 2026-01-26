// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IRageQuit {
    event RageQuitExecuted(
        address indexed user,
        uint256 indexed proposalId,
        uint256 tokensBurned,
        uint256 ethReceived
    );
    event RageQuitWindowUpdated(uint256 newWindow);

    function rageQuit(uint256 proposalId) external;

    function updateRageQuitWindow(uint256 newWindow) external;

    function rageQuitWindow() external view returns (uint256);
    function hasRageQuit(
        uint256 proposalId,
        address user
    ) external view returns (bool);
    function proposalExecutionTime(
        uint256 proposalId
    ) external view returns (uint256);
}
