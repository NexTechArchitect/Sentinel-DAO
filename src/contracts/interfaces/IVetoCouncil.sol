// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IVetoCouncil {
    /**
     * @notice Checks if a specific proposal has been vetoed.
     * @param proposalId The ID of the proposal to check.
     * @return True if the proposal is vetoed, false otherwise.
     */
    function isVetoed(uint256 proposalId) external view returns (bool);

    /**
     * @notice Casts a veto vote against a proposal.
     * @dev Should only be callable by Guardians.
     * @param proposalId The ID of the proposal to veto.
     */
    function castVeto(uint256 proposalId) external;
}