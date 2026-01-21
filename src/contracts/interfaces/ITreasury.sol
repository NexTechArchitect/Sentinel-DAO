// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ITreasury {
    function transferETH(address payable to, uint256 amount) external;
    function transferERC20(address token, address to, uint256 amount) external;
    function transferERC721(
        address token,
        address to,
        uint256 tokenId
    ) external;
    function transferERC1155(
        address token,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    function ethBalance() external view returns (uint256);
    function tokenBalance(address token) external view returns (uint256);
}
