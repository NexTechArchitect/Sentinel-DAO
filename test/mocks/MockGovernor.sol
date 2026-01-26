// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract MockGovernor {
    event AcquisitionRecorded(address indexed account);

   
    function recordTokenAcquisition(address account) external {
       
        emit AcquisitionRecorded(account);
    }
}
