// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {VetoCouncil} from "../../src/contracts/governance/VetoCouncil.sol";
import {Unauthorized} from "../../src/contracts/errors/CommonErrors.sol";


interface IGovernorState {
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }
    function state(uint256 proposalId) external view returns (ProposalState);
}


contract MockRoleManager {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    mapping(address => bool) public guardians;

    function hasRole(bytes32, address account) external view returns (bool) {
        return guardians[account];
    }

    function addGuardian(address account) external {
        guardians[account] = true;
    }
}


contract MockGovernor {
    mapping(uint256 => IGovernorState.ProposalState) public _states;

    function state(uint256 proposalId) external view returns (IGovernorState.ProposalState) {
        return _states[proposalId];
    }

    function setState(uint256 proposalId, IGovernorState.ProposalState newState) external {
        _states[proposalId] = newState;
    }
}


contract VetoCouncilTest is Test {
    VetoCouncil public vetoCouncil;
    MockRoleManager public roleManager;
    MockGovernor public governor;

    address public g1 = makeAddr("guardianOne");
    address public g2 = makeAddr("guardianTwo");
    address public g3 = makeAddr("guardianThree");
    address public hacker = makeAddr("hacker");

    event VetoCast(uint256 indexed proposalId, address indexed councillor);
    event ProposalVetoed(uint256 indexed proposalId);


    function setUp() public {
        roleManager = new MockRoleManager();
        governor = new MockGovernor();
        vetoCouncil = new VetoCouncil(address(roleManager), address(governor));

        roleManager.addGuardian(g1);
        roleManager.addGuardian(g2);
        roleManager.addGuardian(g3);
    }


    function test_InitialState() public view {
        assertEq(vetoCouncil.VETO_THRESHOLD(), 3);
    }


    function test_CastVeto_IncrementsCount() public {
        governor.setState(1, IGovernorState.ProposalState.Active);

        vm.prank(g1);
        vm.expectEmit(true, true, false, false);
        emit VetoCast(1, g1);
        
        vetoCouncil.castVeto(1);

        assertEq(vetoCouncil.vetoVotes(1), 1);
        assertTrue(vetoCouncil.hasVetoed(1, g1));
        assertFalse(vetoCouncil.isVetoed(1)); 
    }


    function test_RevertIf_NotGuardian() public {
        governor.setState(1, IGovernorState.ProposalState.Active);
        
        vm.prank(hacker);
        vm.expectRevert(Unauthorized.selector);
        vetoCouncil.castVeto(1);
    }


    function test_VetoTriggered_AtThreshold() public {
        governor.setState(1, IGovernorState.ProposalState.Active);

        vm.prank(g1); vetoCouncil.castVeto(1);
        
        vm.prank(g2); vetoCouncil.castVeto(1);
        assertFalse(vetoCouncil.isVetoed(1)); 

        vm.prank(g3);
        vm.expectEmit(true, false, false, false);
        emit ProposalVetoed(1); 
        
        vetoCouncil.castVeto(1);

        assertTrue(vetoCouncil.isVetoed(1));
        assertEq(vetoCouncil.vetoVotes(1), 3);
    }


    function test_RevertIf_DoubleVote() public {
        governor.setState(1, IGovernorState.ProposalState.Active);
        
        vm.startPrank(g1);
        vetoCouncil.castVeto(1);

        vm.expectRevert(VetoCouncil.AlreadyCastVeto.selector);
        vetoCouncil.castVeto(1);
        vm.stopPrank();
    }


    function test_RevertIf_InvalidState() public {
        governor.setState(1, IGovernorState.ProposalState.Executed);
        vm.prank(g1);
        vm.expectRevert(VetoCouncil.InvalidProposalState.selector);
        vetoCouncil.castVeto(1);

        governor.setState(2, IGovernorState.ProposalState.Canceled);
        vm.prank(g1);
        vm.expectRevert(VetoCouncil.InvalidProposalState.selector);
        vetoCouncil.castVeto(2);
    }


    function test_RevertIf_AlreadyVetoed() public {
        governor.setState(1, IGovernorState.ProposalState.Active);

        vm.prank(g1); vetoCouncil.castVeto(1);
        vm.prank(g2); vetoCouncil.castVeto(1);
        vm.prank(g3); vetoCouncil.castVeto(1);

        address g4 = makeAddr("guardianFour");
        roleManager.addGuardian(g4);

        vm.prank(g4);
        vm.expectRevert(VetoCouncil.AlreadyVetoedProposal.selector);
        vetoCouncil.castVeto(1);
    }
}