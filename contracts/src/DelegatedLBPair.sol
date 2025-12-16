// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFlareContracts.sol";

/**
 * @title DelegatedLBPair
 * @notice Extension contract for LBPair pools that enables WFLR FTSO delegation
 * @dev This contract wraps an existing LBPair and manages FTSO delegation for WFLR reserves
 *
 * Key Features:
 * - Delegates WFLR voting power to configurable FTSO data provider
 * - Allows governance to change delegation target
 * - Tracks delegation status for transparency
 */
contract DelegatedLBPair {
    // ============ Constants ============
    uint256 public constant MAX_BIPS = 10000; // 100% in basis points

    // ============ Immutables ============
    ILBPair public immutable lbPair;
    IWNat public immutable wflr;

    // ============ State Variables ============
    address public ftsoProvider;
    address public governance;
    address public pendingGovernance;

    bool public isDelegationEnabled;
    uint256 public lastDelegationBlock;

    // ============ Events ============
    event DelegationEnabled(address indexed ftsoProvider, uint256 bips);
    event DelegationDisabled();
    event FTSOProviderUpdated(address indexed oldProvider, address indexed newProvider);
    event GovernanceTransferred(address indexed oldGovernance, address indexed newGovernance);
    event GovernanceProposed(address indexed newGovernance);

    // ============ Errors ============
    error OnlyGovernance();
    error InvalidAddress();
    error DelegationAlreadyEnabled();
    error DelegationNotEnabled();
    error NotPendingGovernance();

    // ============ Modifiers ============
    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernance();
        _;
    }

    // ============ Constructor ============
    /**
     * @param _lbPair The LBPair pool address
     * @param _wflr The WFLR token address
     * @param _ftsoProvider Initial FTSO data provider to delegate to
     * @param _governance Initial governance address
     */
    constructor(
        address _lbPair,
        address _wflr,
        address _ftsoProvider,
        address _governance
    ) {
        if (_lbPair == address(0) || _wflr == address(0) || _governance == address(0)) {
            revert InvalidAddress();
        }

        lbPair = ILBPair(_lbPair);
        wflr = IWNat(_wflr);
        ftsoProvider = _ftsoProvider;
        governance = _governance;
    }

    // ============ External Functions ============

    /**
     * @notice Enable FTSO delegation for WFLR held by this contract
     * @dev Delegates 100% of voting power to the configured FTSO provider
     */
    function enableDelegation() external onlyGovernance {
        if (isDelegationEnabled) revert DelegationAlreadyEnabled();
        if (ftsoProvider == address(0)) revert InvalidAddress();

        // Delegate 100% (10000 bips) to FTSO provider
        wflr.delegate(ftsoProvider, MAX_BIPS);

        isDelegationEnabled = true;
        lastDelegationBlock = block.number;

        emit DelegationEnabled(ftsoProvider, MAX_BIPS);
    }

    /**
     * @notice Disable FTSO delegation
     */
    function disableDelegation() external onlyGovernance {
        if (!isDelegationEnabled) revert DelegationNotEnabled();

        wflr.undelegateAll();

        isDelegationEnabled = false;

        emit DelegationDisabled();
    }

    /**
     * @notice Update the FTSO provider address
     * @param _newProvider New FTSO provider address
     */
    function setFTSOProvider(address _newProvider) external onlyGovernance {
        if (_newProvider == address(0)) revert InvalidAddress();

        address oldProvider = ftsoProvider;
        ftsoProvider = _newProvider;

        // If delegation is enabled, update it
        if (isDelegationEnabled) {
            wflr.undelegateAll();
            wflr.delegate(_newProvider, MAX_BIPS);
            lastDelegationBlock = block.number;
        }

        emit FTSOProviderUpdated(oldProvider, _newProvider);
    }

    /**
     * @notice Propose a new governance address
     * @param _newGovernance Proposed new governance address
     */
    function proposeGovernance(address _newGovernance) external onlyGovernance {
        if (_newGovernance == address(0)) revert InvalidAddress();
        pendingGovernance = _newGovernance;
        emit GovernanceProposed(_newGovernance);
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
     * @notice Get current delegation info
     * @return delegates Array of delegate addresses
     * @return bips Array of delegation amounts in basis points
     */
    function getDelegationInfo() external view returns (
        address[] memory delegates,
        uint256[] memory bips
    ) {
        return wflr.delegatesOf(address(this));
    }

    /**
     * @notice Get current vote power of this contract
     * @return Current vote power
     */
    function getVotePower() external view returns (uint256) {
        return wflr.votePowerOf(address(this));
    }

    /**
     * @notice Get undelegated vote power
     * @return Undelegated vote power
     */
    function getUndelegatedVotePower() external view returns (uint256) {
        return wflr.undelegatedVotePowerOf(address(this));
    }

    /**
     * @notice Check if token is WFLR
     * @param token Token address to check
     * @return True if token is WFLR
     */
    function isWFLR(address token) public view returns (bool) {
        return token == address(wflr);
    }

    /**
     * @notice Get the underlying LBPair's WFLR reserves
     * @return wflrReserve The WFLR reserve amount
     */
    function getWFLRReserve() external view returns (uint128 wflrReserve) {
        address tokenX = lbPair.getTokenX();
        address tokenY = lbPair.getTokenY();

        (uint128 reserveX, uint128 reserveY) = lbPair.getReserves();

        if (isWFLR(tokenX)) {
            return reserveX;
        } else if (isWFLR(tokenY)) {
            return reserveY;
        }
        return 0;
    }
}
