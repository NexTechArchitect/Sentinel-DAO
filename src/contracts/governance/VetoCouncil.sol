// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IRoleManager} from "../interfaces/IRoleManager.sol";
import {Unauthorized, ZeroAddress} from "../errors/CommonErrors.sol";

/**
 * @title VetoCouncil
 * @notice Provides a secondary safety layer where designated Guardians can veto proposals.
 * @dev The Governor checks the veto status of a proposal before final execution.
 */
contract VetoCouncil {

    IRoleManager public immutable ROLE_MANAGER;
    IGovernor public immutable GOVERNOR;
    
    uint256 public constant VETO_THRESHOLD = 3;


    mapping(uint256 => uint256) public vetoVotes;
    mapping(uint256 => mapping(address => bool)) public hasVetoed;
    mapping(uint256 => bool) public isVetoed;


    event VetoCast(uint256 indexed proposalId, address indexed councillor);
    event ProposalVetoed(uint256 indexed proposalId);


    error AlreadyVetoedProposal();
    error AlreadyCastVeto();
    error InvalidProposalState();


    constructor(address _roleManager, address _governor) {
        if (_roleManager == address(0) || _governor == address(0)) revert ZeroAddress();

        ROLE_MANAGER = IRoleManager(_roleManager);
        GOVERNOR = IGovernor(_governor);
    }


    /**
     * @notice Casts a veto vote against a specific proposal.
     * @dev Only callable by accounts with the GUARDIAN_ROLE.
     * @param proposalId The ID of the proposal to be vetoed.
     */
    function castVeto(uint256 proposalId) external {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.GUARDIAN_ROLE(), msg.sender)) {
            revert Unauthorized();
        }

        if (isVetoed[proposalId]) revert AlreadyVetoedProposal();
        if (hasVetoed[proposalId][msg.sender]) revert AlreadyCastVeto();

        IGovernor.ProposalState s = GOVERNOR.state(proposalId);
        if (
            s == IGovernor.ProposalState.Executed ||
            s == IGovernor.ProposalState.Canceled ||
            s == IGovernor.ProposalState.Expired
        ) {
            revert InvalidProposalState();
        }


        hasVetoed[proposalId][msg.sender] = true;
        
        uint256 currentVotes;
        unchecked {
            currentVotes = vetoVotes[proposalId] + 1;
            vetoVotes[proposalId] = currentVotes;
        }

        emit VetoCast(proposalId, msg.sender);


        /**
         * If threshold is reached, mark as vetoed. 
         * The Governor's execution logic will verify this state.
         */
        if (currentVotes >= VETO_THRESHOLD) {
            isVetoed[proposalId] = true;
            emit ProposalVetoed(proposalId);
        }
    }
}