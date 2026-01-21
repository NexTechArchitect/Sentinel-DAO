// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {
    GovernorSettings
} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {
    GovernorCountingSimple
} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {
    GovernorVotes
} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {
    GovernorTimelockControl
} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {DAOConfig} from "../config/DAOConfig.sol";

/**
 * @title Hybrid Dynamic Governor
 * @notice The core decision-making engine of the DAO.
 * @dev This contract integrates multiple OpenZeppelin governance modules to create a complete
 * on-chain voting system. Uniquely, it delegates configuration values (Delay, Period, Threshold)
 * to an external `DAOConfig` contract, allowing for flexible parameter updates without
 * redeploying the Governor itself.
 *
 * @custom:security-note This contract controls the Timelock, which in turn controls the Treasury.
 * @author NexTechArchitect
 */
contract HybridGovernorDynamic is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The external configuration contract source.
    DAOConfig public immutable daoConfig;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the Governor with all required modules.
     * @param token The governance token (IVotes) used for voting power.
     * @param timelock The execution controller.
     * @param _daoConfig The dynamic configuration source.
     */
    constructor(
        IVotes token,
        TimelockController timelock,
        DAOConfig _daoConfig
    )
        Governor("HybridGovernorDynamic")
        GovernorSettings(
            _daoConfig.votingDelay(),
            _daoConfig.votingPeriod(),
            _daoConfig.proposalThreshold()
        )
        GovernorVotes(token)
        GovernorVotesQuorumFraction(_daoConfig.quorumPercentage())
        GovernorTimelockControl(timelock)
    {
        daoConfig = _daoConfig;
    }

    /*//////////////////////////////////////////////////////////////
                          DAO CONFIG OVERRIDES
    //////////////////////////////////////////////////////////////*/

    // The functions below override the standard storage reads.
    // Instead of reading local variables, they fetch live data from DAOConfig.

    /**
     * @notice Returns the delay between proposal creation and voting start.
     * @return The delay in blocks/seconds (fetched from DAOConfig).
     */
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return daoConfig.votingDelay();
    }

    /**
     * @notice Returns the duration of the voting window.
     * @return The duration in blocks/seconds (fetched from DAOConfig).
     */
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return daoConfig.votingPeriod();
    }

    /**
     * @notice Returns the number of votes required to create a proposal.
     * @return The threshold amount (fetched from DAOConfig).
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return daoConfig.proposalThreshold();
    }

    /**
     * @notice Calculates the quorum required for a proposal to pass.
     * @dev Fetches the percentage from config and applies it to total supply.
     */
    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /*//////////////////////////////////////////////////////////////
                       TIMELOCK OVERRIDES (INTEGRATION)
    //////////////////////////////////////////////////////////////*/

    // The following overrides are required by Solidity because GovernorTimelockControl
    // conflicts with the base Governor contract. We simply route them to super.

    function state(
        uint256 proposalId
    )
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    ) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return
            super._queueOperations(
                proposalId,
                targets,
                values,
                calldatas,
                descriptionHash
            );
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    /**
     * @notice Resolves inheritance conflict for interface support.
     * @dev Explicitly calls the base Governor implementation.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}