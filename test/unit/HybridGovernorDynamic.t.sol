// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {
    HybridGovernorDynamic
} from "../../src/contracts/core/HybridGovernorDynamic.sol";
import {DAOConfig} from "../../src/contracts/config/DAOConfig.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {
    ERC20Permit
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {
    ERC20Votes
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {
    TimelockController
} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract MockGovToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("MockToken", "MTK") ERC20Permit("MockToken") {
        _mint(msg.sender, 1_000_000 ether);
        delegate(msg.sender);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}

contract HybridGovernorDynamicTest is Test {
    HybridGovernorDynamic governor;
    DAOConfig config;
    TimelockController timelock;
    MockGovToken token;

    address admin;

    function setUp() public {
        admin = address(this);
        token = new MockGovToken();

        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = admin;
        executors[0] = admin;

        timelock = new TimelockController(2 days, proposers, executors, admin);

        config = new DAOConfig(
            address(timelock),
            1 days,
            5 days,
            4,
            1000 ether
        );

        governor = new HybridGovernorDynamic(token, timelock, config);
    }

    /*//////////////////////////////////////////////////////////////
                            CONFIG READ TESTS
    //////////////////////////////////////////////////////////////*/

    // FIX: Added 'view' modifier to silence warnings
    function test_votingDelay_fromConfig() public view {
        assertEq(governor.votingDelay(), 1 days);
    }

    // FIX: Added 'view' modifier
    function test_votingPeriod_fromConfig() public view {
        assertEq(governor.votingPeriod(), 5 days);
    }

    // FIX: Added 'view' modifier
    function test_proposalThreshold_fromConfig() public view {
        assertEq(governor.proposalThreshold(), 1000 ether);
    }

    // Note: test_quorum_works modifies vm state (vm.roll), so NO 'view' here
    function test_quorum_works() public {
        vm.roll(block.number + 1);
        uint256 quorum = governor.quorum(block.number - 1);
        assertGt(quorum, 0);
    }

    // FIX: Added 'view' modifier
    function test_executor_is_timelock() public view {
        assertEq(address(governor.timelock()), address(timelock));
    }
}
