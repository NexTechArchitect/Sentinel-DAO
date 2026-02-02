// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract DAOSmartAccount {
    address public owner;
    address public immutable ENTRY_POINT;

    constructor(address _entryPoint, address _owner) {
        ENTRY_POINT = _entryPoint;
        owner = _owner;
    }

    receive() external payable {}

    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == ENTRY_POINT || msg.sender == owner, "Unauthorized");
        (bool success,) = dest.call{value: value}(func);
        require(success, "Execution failed");
    }
}

contract DAOAccountFactory {
    address public immutable ENTRY_POINT;

    constructor(address _entryPoint) {
        ENTRY_POINT = _entryPoint;
    }

    function createAccount(address owner, uint256 ) external returns (address) {
       
        DAOSmartAccount newAcc = new DAOSmartAccount(ENTRY_POINT, owner);
        return address(newAcc);
    }
}
