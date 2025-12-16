// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFlareContracts.sol";

/**
 * @title FlareRewardsDistributor
 * @notice Claims FTSO rewards and FlareDrops, distributes them proportionally to LPs
 * @dev Works with LBPair pools to distribute rewards based on liquidity share
 *
 * Key Features:
 * - Claims FTSO delegation rewards from FtsoRewardManager
 * - Claims FlareDrops from DistributionToDelegators
 * - Distributes rewards proportionally to LP token holders
 * - Supports multiple reward epochs and months
 */
contract FlareRewardsDistributor {
    // ============ Structs ============
    struct PoolInfo {
        address lbPair;
        address delegatedPair;
        bool isActive;
        uint256 totalRewardsDistributed;
    }

    struct UserReward {
        uint256 claimableAmount;
        uint256 lastClaimedEpoch;
        uint256 lastClaimedMonth;
    }

    // ============ Constants ============
    uint256 public constant PRECISION = 1e18;

    // ============ Immutables ============
    IWNat public immutable wflr;
    IFlareContractRegistry public immutable contractRegistry;

    // ============ State Variables ============
    address public governance;
    address public pendingGovernance;
    address public rewardsClaimer; // Address authorized to trigger claims

    // Pool ID => Pool Info
    mapping(bytes32 => PoolInfo) public pools;
    bytes32[] public poolIds;

    // Pool ID => User => Reward Info
    mapping(bytes32 => mapping(address => UserReward)) public userRewards;

    // Pool ID => Total accumulated rewards per share (scaled by PRECISION)
    mapping(bytes32 => uint256) public accRewardPerShare;

    // Pool ID => User => Reward debt
    mapping(bytes32 => mapping(address => uint256)) public rewardDebt;

    // Pool ID => Bin ID => Snapshot of total supply
    mapping(bytes32 => mapping(uint24 => uint256)) public binTotalSupplySnapshot;

    // Cached contract addresses
    address public ftsoRewardManager;
    address public distributionToDelegators;

    // ============ Events ============
    event PoolAdded(bytes32 indexed poolId, address lbPair, address delegatedPair);
    event PoolRemoved(bytes32 indexed poolId);
    event RewardsClaimed(bytes32 indexed poolId, uint256 ftsoRewards, uint256 flareDrops);
    event RewardsDistributed(bytes32 indexed poolId, uint256 totalAmount);
    event UserClaimed(bytes32 indexed poolId, address indexed user, uint256 amount);
    event ContractAddressesUpdated(address ftsoRewardManager, address distributionToDelegators);
    event GovernanceTransferred(address indexed oldGovernance, address indexed newGovernance);
    event RewardsClaimerUpdated(address indexed oldClaimer, address indexed newClaimer);

    // ============ Errors ============
    error OnlyGovernance();
    error OnlyRewardsClaimer();
    error InvalidAddress();
    error PoolNotFound();
    error PoolAlreadyExists();
    error NoRewardsToClaim();
    error TransferFailed();
    error NotPendingGovernance();

    // ============ Modifiers ============
    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernance();
        _;
    }

    modifier onlyRewardsClaimer() {
        if (msg.sender != rewardsClaimer && msg.sender != governance) {
            revert OnlyRewardsClaimer();
        }
        _;
    }

    // ============ Constructor ============
    /**
     * @param _wflr WFLR token address
     * @param _contractRegistry Flare Contract Registry address
     * @param _governance Initial governance address
     */
    constructor(
        address _wflr,
        address _contractRegistry,
        address _governance
    ) {
        if (_wflr == address(0) || _contractRegistry == address(0) || _governance == address(0)) {
            revert InvalidAddress();
        }

        wflr = IWNat(_wflr);
        contractRegistry = IFlareContractRegistry(_contractRegistry);
        governance = _governance;
        rewardsClaimer = _governance;

        // Cache contract addresses
        _updateContractAddresses();
    }

    // ============ External Functions ============

    /**
     * @notice Add a new pool for rewards distribution
     * @param _lbPair LBPair address
     * @param _delegatedPair DelegatedLBPair wrapper address
     */
    function addPool(address _lbPair, address _delegatedPair) external onlyGovernance {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));

        if (pools[poolId].lbPair != address(0)) revert PoolAlreadyExists();

        pools[poolId] = PoolInfo({
            lbPair: _lbPair,
            delegatedPair: _delegatedPair,
            isActive: true,
            totalRewardsDistributed: 0
        });

        poolIds.push(poolId);

        emit PoolAdded(poolId, _lbPair, _delegatedPair);
    }

    /**
     * @notice Remove a pool from rewards distribution
     * @param _lbPair LBPair address
     */
    function removePool(address _lbPair) external onlyGovernance {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));

        if (pools[poolId].lbPair == address(0)) revert PoolNotFound();

        pools[poolId].isActive = false;

        emit PoolRemoved(poolId);
    }

    /**
     * @notice Claim FTSO rewards for a pool
     * @param _lbPair LBPair address
     * @param _rewardEpochs Array of reward epochs to claim
     */
    function claimFTSORewards(
        address _lbPair,
        uint256[] calldata _rewardEpochs
    ) external onlyRewardsClaimer returns (uint256 rewardAmount) {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));
        PoolInfo storage pool = pools[poolId];

        if (pool.lbPair == address(0)) revert PoolNotFound();

        IFtsoRewardManager rewardManager = IFtsoRewardManager(ftsoRewardManager);

        // Claim rewards (sent to this contract)
        rewardAmount = rewardManager.claimReward(
            payable(address(this)),
            _rewardEpochs
        );

        if (rewardAmount > 0) {
            _distributeRewards(poolId, rewardAmount);
        }

        emit RewardsClaimed(poolId, rewardAmount, 0);
        return rewardAmount;
    }

    /**
     * @notice Claim FlareDrops for a pool
     * @param _lbPair LBPair address
     * @param _month Month to claim
     */
    function claimFlareDrop(
        address _lbPair,
        uint256 _month
    ) external onlyRewardsClaimer returns (uint256 rewardAmount) {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));
        PoolInfo storage pool = pools[poolId];

        if (pool.lbPair == address(0)) revert PoolNotFound();

        IDistributionToDelegators distribution = IDistributionToDelegators(distributionToDelegators);

        // Claim FlareDrop (wrap as WFLR)
        rewardAmount = distribution.claim(
            pool.delegatedPair,
            address(this),
            _month,
            true // Wrap as WFLR
        );

        if (rewardAmount > 0) {
            _distributeRewards(poolId, rewardAmount);
        }

        emit RewardsClaimed(poolId, 0, rewardAmount);
        return rewardAmount;
    }

    /**
     * @notice Claim all available rewards for a pool
     * @param _lbPair LBPair address
     */
    function claimAllRewards(address _lbPair) external onlyRewardsClaimer returns (uint256 totalRewards) {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));
        PoolInfo storage pool = pools[poolId];

        if (pool.lbPair == address(0)) revert PoolNotFound();

        IFtsoRewardManager rewardManager = IFtsoRewardManager(ftsoRewardManager);
        IDistributionToDelegators distribution = IDistributionToDelegators(distributionToDelegators);

        // Get claimable FTSO epochs
        (uint256 startEpoch, uint256 endEpoch) = rewardManager.getEpochsWithClaimableRewards();

        uint256 ftsoRewards = 0;
        if (endEpoch >= startEpoch) {
            uint256 epochCount = endEpoch - startEpoch + 1;
            uint256[] memory epochs = new uint256[](epochCount);
            for (uint256 i = 0; i < epochCount; i++) {
                epochs[i] = startEpoch + i;
            }

            ftsoRewards = rewardManager.claimReward(
                payable(address(this)),
                epochs
            );
        }

        // Get claimable FlareDrop months
        uint256 currentMonth = distribution.getCurrentMonth();
        uint256 flareDropRewards = 0;

        // Try to claim current month
        try distribution.claim(pool.delegatedPair, address(this), currentMonth, true) returns (uint256 amount) {
            flareDropRewards = amount;
        } catch {}

        totalRewards = ftsoRewards + flareDropRewards;

        if (totalRewards > 0) {
            _distributeRewards(poolId, totalRewards);
        }

        emit RewardsClaimed(poolId, ftsoRewards, flareDropRewards);
        return totalRewards;
    }

    /**
     * @notice User claims their share of rewards
     * @param _lbPair LBPair address
     */
    function claimUserRewards(address _lbPair) external returns (uint256 reward) {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));
        PoolInfo storage pool = pools[poolId];

        if (pool.lbPair == address(0)) revert PoolNotFound();

        reward = _calculatePendingRewards(poolId, msg.sender);

        if (reward == 0) revert NoRewardsToClaim();

        // Update reward debt
        rewardDebt[poolId][msg.sender] += reward;

        // Transfer WFLR rewards
        bool success = wflr.transfer(msg.sender, reward);
        if (!success) revert TransferFailed();

        emit UserClaimed(poolId, msg.sender, reward);
        return reward;
    }

    /**
     * @notice Get pending rewards for a user
     * @param _lbPair LBPair address
     * @param _user User address
     * @return pending Pending reward amount
     */
    function pendingRewards(address _lbPair, address _user) external view returns (uint256 pending) {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));
        return _calculatePendingRewards(poolId, _user);
    }

    /**
     * @notice Update cached contract addresses from registry
     */
    function updateContractAddresses() external {
        _updateContractAddresses();
    }

    /**
     * @notice Set the rewards claimer address
     * @param _claimer New claimer address
     */
    function setRewardsClaimer(address _claimer) external onlyGovernance {
        if (_claimer == address(0)) revert InvalidAddress();
        address oldClaimer = rewardsClaimer;
        rewardsClaimer = _claimer;
        emit RewardsClaimerUpdated(oldClaimer, _claimer);
    }

    /**
     * @notice Propose a new governance address
     * @param _newGovernance Proposed new governance
     */
    function proposeGovernance(address _newGovernance) external onlyGovernance {
        if (_newGovernance == address(0)) revert InvalidAddress();
        pendingGovernance = _newGovernance;
    }

    /**
     * @notice Accept governance transfer
     */
    function acceptGovernance() external {
        if (msg.sender != pendingGovernance) revert NotPendingGovernance();

        address oldGovernance = governance;
        governance = pendingGovernance;
        pendingGovernance = address(0);

        emit GovernanceTransferred(oldGovernance, governance);
    }

    // ============ View Functions ============

    /**
     * @notice Get pool info
     * @param _lbPair LBPair address
     */
    function getPoolInfo(address _lbPair) external view returns (PoolInfo memory) {
        bytes32 poolId = keccak256(abi.encodePacked(_lbPair));
        return pools[poolId];
    }

    /**
     * @notice Get all active pool addresses
     */
    function getActivePools() external view returns (address[] memory activePools) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < poolIds.length; i++) {
            if (pools[poolIds[i]].isActive) {
                activeCount++;
            }
        }

        activePools = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < poolIds.length; i++) {
            if (pools[poolIds[i]].isActive) {
                activePools[index] = pools[poolIds[i]].lbPair;
                index++;
            }
        }

        return activePools;
    }

    /**
     * @notice Get claimable FTSO reward info
     */
    function getClaimableFTSOInfo() external view returns (
        uint256 startEpoch,
        uint256 endEpoch,
        uint256 currentEpoch
    ) {
        IFtsoRewardManager rewardManager = IFtsoRewardManager(ftsoRewardManager);
        (startEpoch, endEpoch) = rewardManager.getEpochsWithClaimableRewards();
        currentEpoch = rewardManager.getCurrentRewardEpoch();
    }

    /**
     * @notice Get claimable FlareDrop info
     */
    function getClaimableFlareDropInfo() external view returns (
        uint256 currentMonth,
        uint256 monthToExpireNext,
        uint256 secondsUntilNext
    ) {
        IDistributionToDelegators distribution = IDistributionToDelegators(distributionToDelegators);
        currentMonth = distribution.getCurrentMonth();
        monthToExpireNext = distribution.getMonthToExpireNext();
        secondsUntilNext = distribution.secondsUntilNextClaim();
    }

    // ============ Internal Functions ============

    /**
     * @dev Distribute rewards to pool
     */
    function _distributeRewards(bytes32 _poolId, uint256 _amount) internal {
        PoolInfo storage pool = pools[_poolId];

        // Get total liquidity in pool (simplified - using WFLR balance)
        ILBPair pair = ILBPair(pool.lbPair);
        (uint128 reserveX, uint128 reserveY) = pair.getReserves();
        uint256 totalLiquidity = uint256(reserveX) + uint256(reserveY);

        if (totalLiquidity > 0) {
            // Update accumulated rewards per share
            accRewardPerShare[_poolId] += (_amount * PRECISION) / totalLiquidity;
        }

        pool.totalRewardsDistributed += _amount;

        emit RewardsDistributed(_poolId, _amount);
    }

    /**
     * @dev Calculate pending rewards for user
     */
    function _calculatePendingRewards(bytes32 _poolId, address _user) internal view returns (uint256) {
        PoolInfo storage pool = pools[_poolId];
        if (pool.lbPair == address(0)) return 0;

        ILBPair pair = ILBPair(pool.lbPair);

        // Get active bin
        uint24 activeId = pair.getActiveId();

        // Get user's share in active bin (simplified calculation)
        uint256 userBalance = pair.balanceOf(_user, activeId);
        uint256 totalSupply = pair.totalSupply(activeId);

        if (totalSupply == 0 || userBalance == 0) return 0;

        // Calculate user's share of total liquidity
        (uint128 reserveX, uint128 reserveY) = pair.getReserves();
        uint256 totalLiquidity = uint256(reserveX) + uint256(reserveY);

        uint256 userLiquidity = (totalLiquidity * userBalance) / totalSupply;

        // Calculate pending rewards
        uint256 accumulatedReward = (userLiquidity * accRewardPerShare[_poolId]) / PRECISION;
        uint256 debt = rewardDebt[_poolId][_user];

        return accumulatedReward > debt ? accumulatedReward - debt : 0;
    }

    /**
     * @dev Update contract addresses from registry
     */
    function _updateContractAddresses() internal {
        ftsoRewardManager = contractRegistry.getContractAddressByName("FtsoRewardManager");
        distributionToDelegators = contractRegistry.getContractAddressByName("DistributionToDelegators");

        emit ContractAddressesUpdated(ftsoRewardManager, distributionToDelegators);
    }

    // ============ Receive Function ============
    receive() external payable {
        // Wrap received FLR as WFLR
        wflr.deposit{value: msg.value}();
    }
}
