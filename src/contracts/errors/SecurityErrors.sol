// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

//////////////////////////////////////////
//             SecurityErrors           //
//////////////////////////////////////////

error OnlyAdmin();
error OnlyGuardian();
error RoleAlreadyGranted();
error RoleNotGranted();
error SignerMismatch();
error ZeroAddressProvided();

error AlreadyPaused();
error NotPaused();
