// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IWNat - Wrapped Native Token Interface (WFLR on Flare)
 * @notice Interface for WFLR delegation functionality
 */
interface IWNat {
    // Standard ERC20
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // Wrap/Unwrap
    function deposit() external payable;
    function withdraw(uint256 amount) external;

    // Delegation (VPToken)
    function delegate(address _to, uint256 _bips) external;
    function delegateExplicit(address _to, uint256 _amount) external;
    function undelegateAll() external;
    function revokeDelegationAt(address _who, uint256 _blockNumber) external;

    // Delegation queries
    function delegatesOf(address _owner) external view returns (address[] memory _delegateAddresses, uint256[] memory _bips);
    function delegatesOfAt(address _owner, uint256 _blockNumber) external view returns (address[] memory _delegateAddresses, uint256[] memory _bips);
    function votePowerOf(address _owner) external view returns (uint256);
    function votePowerOfAt(address _owner, uint256 _blockNumber) external view returns (uint256);
    function votePowerFromTo(address _from, address _to) external view returns (uint256);
    function votePowerFromToAt(address _from, address _to, uint256 _blockNumber) external view returns (uint256);
    function undelegatedVotePowerOf(address _owner) external view returns (uint256);
    function undelegatedVotePowerOfAt(address _owner, uint256 _blockNumber) external view returns (uint256);

    // Governance vote power
    function governanceVotePower() external view returns (address);
}

/**
 * @title IFtsoRewardManager - FTSO Reward Manager Interface
 * @notice Interface for claiming FTSO delegation rewards
 */
interface IFtsoRewardManager {
    function claimReward(
        address payable _recipient,
        uint256[] calldata _rewardEpochs
    ) external returns (uint256 _rewardAmount);

    function claimRewardFromDataProviders(
        address payable _recipient,
        uint256[] calldata _rewardEpochs,
        address[] calldata _dataProviders
    ) external returns (uint256 _rewardAmount);

    function getEpochsWithClaimableRewards() external view returns (uint256 _startEpochId, uint256 _endEpochId);

    function getStateOfRewards(
        address _beneficiary,
        uint256 _rewardEpoch
    ) external view returns (
        address[] memory _dataProviders,
        uint256[] memory _rewardAmounts,
        bool[] memory _claimed,
        bool _claimable
    );

    function getEpochReward(uint256 _rewardEpoch) external view returns (uint256 _totalReward, uint256 _claimedReward);

    function getDataProviderCurrentFeePercentage(address _dataProvider) external view returns (uint256 _feePercentageBIPS);

    function getRewardEpochToExpireNext() external view returns (uint256);

    function getCurrentRewardEpoch() external view returns (uint256);
}

/**
 * @title IDistributionToDelegators - FlareDrop Distribution Interface
 * @notice Interface for claiming FlareDrops
 */
interface IDistributionToDelegators {
    function claim(address _rewardOwner, address _recipient, uint256 _month, bool _wrap) external returns (uint256 _rewardAmount);

    function autoClaim(address[] calldata _rewardOwners, uint256 _month) external returns (uint256 _rewardAmount);

    function getClaimableAmount(uint256 _month) external view returns (uint256 _amountWei);

    function getClaimableAmountOf(address _account, uint256 _month) external view returns (uint256 _amountWei);

    function getCurrentMonth() external view returns (uint256 _currentMonth);

    function getMonthToExpireNext() external view returns (uint256 _monthToExpireNext);

    function secondsUntilNextClaim() external view returns (uint256 _seconds);
}

/**
 * @title IFlareContractRegistry - Flare Contract Registry Interface
 * @notice Interface to get addresses of Flare system contracts
 */
interface IFlareContractRegistry {
    function getContractAddressByName(string calldata _name) external view returns (address);
    function getContractAddressByHash(bytes32 _nameHash) external view returns (address);
    function getContractAddressesByName(string[] calldata _names) external view returns (address[] memory);
    function getContractAddressesByHash(bytes32[] calldata _nameHashes) external view returns (address[] memory);
    function getAllContracts() external view returns (string[] memory _names, address[] memory _addresses);
}

/**
 * @title ILBPair - Liquidity Book Pair Interface (minimal)
 */
interface ILBPair {
    function getTokenX() external view returns (address);
    function getTokenY() external view returns (address);
    function getActiveId() external view returns (uint24);
    function getBin(uint24 id) external view returns (uint128 binReserveX, uint128 binReserveY);
    function getReserves() external view returns (uint128 reserveX, uint128 reserveY);
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function totalSupply(uint256 id) external view returns (uint256);
    function isApprovedForAll(address owner, address spender) external view returns (bool);
    function setApprovalForAll(address spender, bool approved) external;
}
