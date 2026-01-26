// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Thrown when an input address is address(0)
error ZeroAddress();

/// @notice Thrown when an input amount is 0
error ZeroAmount();

/// @notice Thrown when two array lengths do not match
error ArrayLengthMismatch();

/// @notice Thrown when a caller is not authorized to perform an action
error Unauthorized();

/// @notice Thrown when an input value is invalid (generic)
error InvalidValue();

/// @notice Thrown when updating a variable to the same value
error SameValue();

/// @notice Thrown when a low-level call (transfer/execution) fails
error CallFailed();
/// @notice Thrown when an input address is invalid (e.g., not a contract)
error InvalidAddress();

error LengthMismatch();
