// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title ITreasury (Advanced)
 * @notice Interface for the DAO Vault with Rage Quit and Batching support.
 */
interface ITreasury {

    event FundsReceived(address indexed sender, uint256 amount);
    event FundsSent(address indexed recipient, uint256 amount);
    event RageQuitContractSet(address indexed newAddress);

    
    function setRageQuitContract(address _rageQuit) external;
    function TIMELOCK() external view returns (address);
    function rageQuitContract() external view returns (address);

    
    function transferEth(address payable to, uint256 amount) external;
    function transferERC20(address token, address to, uint256 amount) external;

    function batchTransferERC20(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external;

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

    function depositEth() external payable;
    function depositERC20(address token, uint256 amount) external;
    function depositERC721(address token, uint256 tokenId) external;
    function depositERC1155(
        address token,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    
    function ethBalance() external view returns (uint256);
    function tokenBalance(address token) external view returns (uint256);
}
