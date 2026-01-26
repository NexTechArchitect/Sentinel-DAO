// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {RoleManager} from "../security/RoleManager.sol";

/**
 * @title QuadraticFunding
 * @author Turtur (FOUNDRY-DAO-F25)
 * @notice Implements a matching pool system where the number of contributors matters more than the amount.
 * @dev Uses the formula: (sum of square roots of contributions)^2 to determine matching weight.
 */
contract QuadraticFunding is ReentrancyGuard {
    using SafeERC20 for IERC20;


    struct Project {
        address owner;
        uint256 totalContributed;
        uint256 sumOfSqRts;
        uint256 matchedAmount;
        bool isActive;
        bool matchingClaimed;
    }


    RoleManager public immutable ROLE_MANAGER;
    IERC20 public immutable FUNDING_TOKEN;
    
    uint256 public matchingPool;
    uint256 public totalWeight;
    uint256 public projectCount;
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    uint256 public constant SCALE = 1e18;


    event ProjectCreated(uint256 indexed projectId, address indexed owner);
    event ContributionMade(uint256 indexed projectId, address indexed contributor, uint256 amount);
    event MatchingPoolFunded(uint256 amount);
    event MatchingDistributed(uint256 totalDistributed);


    error Unauthorized();
    error ProjectNotActive();
    error InsufficientAmount();
    error AlreadyClaimed();


    modifier onlyAdmin() {
        _checkAdmin();
        _;
    }


    function _checkAdmin() internal view {
        if (!ROLE_MANAGER.hasRole(ROLE_MANAGER.ADMIN_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
    }


    constructor(address _roleManager, address _token) {
        ROLE_MANAGER = RoleManager(_roleManager);
        FUNDING_TOKEN = IERC20(_token);
    }


    function createProject(address _owner) external returns (uint256 projectId) {
        projectId = ++projectCount;

        projects[projectId] = Project({
            owner: _owner,
            totalContributed: 0,
            sumOfSqRts: 0,
            matchedAmount: 0,
            isActive: true,
            matchingClaimed: false
        });

        emit ProjectCreated(projectId, _owner);
    }


    /**
     * @notice Allows a user to contribute to a project.
     * @dev Calculates and updates the sum of square roots for quadratic weight.
     */
    function contribute(uint256 _projectId, uint256 _amount) external nonReentrant {
        Project storage project = projects[_projectId];

        if (!project.isActive) revert ProjectNotActive();
        if (_amount == 0) revert InsufficientAmount();

        FUNDING_TOKEN.safeTransferFrom(msg.sender, address(this), _amount);

        // Calculate sqrt with precision scale
        uint256 sqrtContribution = Math.sqrt(_amount * SCALE);
        
        unchecked {
            project.totalContributed += _amount;
            project.sumOfSqRts += sqrtContribution;
            contributions[_projectId][msg.sender] += _amount;
        }

        emit ContributionMade(_projectId, msg.sender, _amount);
    }


    function fundMatchingPool(uint256 _amount) external onlyAdmin {
        FUNDING_TOKEN.safeTransferFrom(msg.sender, address(this), _amount);

        unchecked { matchingPool += _amount; }

        emit MatchingPoolFunded(_amount);
    }


    /**
     * @notice Finalizes the matching calculation for all active projects.
     * @dev Weight = (Sum of Square Roots)^2. Total matching is distributed proportionally.
     */
    function calculateMatching() external onlyAdmin {
        uint256 _totalWeight = 0;
        uint256 _projectCount = projectCount;

        uint256[] memory weights = new uint256[](_projectCount + 1);

        for (uint256 i = 1; i <= _projectCount; ) {
            uint256 s = projects[i].sumOfSqRts;

            if (s > 0) {
                uint256 weight = (s * s) / SCALE;
                weights[i] = weight;
                _totalWeight += weight;
            }

            unchecked { ++i; }
        }

        if (_totalWeight == 0) return;
        totalWeight = _totalWeight;

        for (uint256 i = 1; i <= _projectCount; ) {
            if (weights[i] > 0) {
                projects[i].matchedAmount = (matchingPool * weights[i]) / _totalWeight;
            }
            unchecked { ++i; }
        }

        emit MatchingDistributed(matchingPool);
    }


    function claimFunds(uint256 _projectId) external nonReentrant {
        Project storage project = projects[_projectId];

        if (msg.sender != project.owner) revert Unauthorized();
        if (project.matchingClaimed) revert AlreadyClaimed();

        project.matchingClaimed = true;
        uint256 totalPayout = project.totalContributed + project.matchedAmount;
        
        FUNDING_TOKEN.safeTransfer(project.owner, totalPayout);
    }


    function setProjectStatus(uint256 _projectId, bool _status) external onlyAdmin {
        projects[_projectId].isActive = _status;
    }
}