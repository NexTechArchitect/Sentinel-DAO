// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

contract DAOPayMaster {
    address public immutable ENTRY_POINT;
    address public owner;

    constructor(address _entryPoint) {
        ENTRY_POINT = _entryPoint;
        owner = msg.sender;
    }

    receive() external payable {}

    function validatePaymasterUserOp(
        UserOperation calldata , 
        bytes32 , 
        uint256 
    ) external pure returns (bytes memory context, uint256 validationData) {
      
        return ("", 0); 
    }

    function postOp(uint256 , bytes calldata , uint256 ) external pure {}

    function withdrawStack(address payable to, uint256 amount) external {
        require(msg.sender == owner, "Not owner");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
