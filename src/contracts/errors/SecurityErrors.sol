// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/*////////////////////////////////////////////////
                SECURITY ERRORS
////////////////////////////////////////////////*/
// EmergencyPause errors
error OnlyGuardian();
error AlreadyPaused();
error NotPaused();
// RoleManager errors
error OnlyAdmin();
error ZeroAddress();
error RoleNotGranted();
error RoleAlreadyGranted();
