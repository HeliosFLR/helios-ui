// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DelegatedLBPair.sol";
import "../src/FlareRewardsDistributor.sol";
import "../interfaces/IFlareContracts.sol";

/**
 * @title SetupDelegation
 * @notice Deployment script to setup WFLR delegation for Helios DEX pools
 *
 * Usage:
 *   forge script script/SetupDelegation.s.sol:SetupDelegation --rpc-url $RPC_URL --broadcast
 *
 * Environment Variables:
 *   PRIVATE_KEY - Deployer private key
 *   FTSO_PROVIDER - FTSO data provider address to delegate to
 */
contract SetupDelegation is Script {
    // ============ Coston2 Testnet Addresses ============
    address constant WFLR_COSTON2 = 0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273;
    address constant CONTRACT_REGISTRY_COSTON2 = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;

    // Helios DEX Pool Addresses (Coston2)
    address constant WFLR_USDT_POOL = 0x986ca52F9Cd6Ef80D8CA94AD343Be1fb9aCA4Fd9;
    address constant WFLR_USDC_POOL = 0x4cB30D4eb2c4230a662eD1c3e33E6FbeFE2B6C9f;
    address constant WFLR_SFLR_POOL = 0x6f0cE7ce63a7dD14BB6ACb8d1cEDcF9DC7f10E55;

    // ============ Flare Mainnet Addresses ============
    address constant WFLR_MAINNET = 0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d;
    address constant CONTRACT_REGISTRY_MAINNET = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;

    // ============ Deployed Contracts ============
    DelegatedLBPair public delegatedWflrUsdt;
    DelegatedLBPair public delegatedWflrUsdc;
    DelegatedLBPair public delegatedWflrSflr;
    FlareRewardsDistributor public rewardsDistributor;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address ftsoProvider = vm.envAddress("FTSO_PROVIDER");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("FTSO Provider:", ftsoProvider);

        // Determine network
        bool isMainnet = block.chainid == 14; // Flare mainnet
        address wflr = isMainnet ? WFLR_MAINNET : WFLR_COSTON2;
        address registry = isMainnet ? CONTRACT_REGISTRY_MAINNET : CONTRACT_REGISTRY_COSTON2;

        console.log("Network:", isMainnet ? "Flare Mainnet" : "Coston2 Testnet");
        console.log("WFLR:", wflr);
        console.log("Contract Registry:", registry);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy FlareRewardsDistributor
        rewardsDistributor = new FlareRewardsDistributor(
            wflr,
            registry,
            deployer
        );
        console.log("FlareRewardsDistributor deployed:", address(rewardsDistributor));

        // 2. Deploy DelegatedLBPair wrappers for each pool
        if (!isMainnet) {
            // Coston2 pools
            delegatedWflrUsdt = new DelegatedLBPair(
                WFLR_USDT_POOL,
                wflr,
                ftsoProvider,
                deployer
            );
            console.log("DelegatedLBPair (WFLR/USDT) deployed:", address(delegatedWflrUsdt));

            delegatedWflrUsdc = new DelegatedLBPair(
                WFLR_USDC_POOL,
                wflr,
                ftsoProvider,
                deployer
            );
            console.log("DelegatedLBPair (WFLR/USDC) deployed:", address(delegatedWflrUsdc));

            delegatedWflrSflr = new DelegatedLBPair(
                WFLR_SFLR_POOL,
                wflr,
                ftsoProvider,
                deployer
            );
            console.log("DelegatedLBPair (WFLR/sFLR) deployed:", address(delegatedWflrSflr));

            // 3. Add pools to rewards distributor
            rewardsDistributor.addPool(WFLR_USDT_POOL, address(delegatedWflrUsdt));
            rewardsDistributor.addPool(WFLR_USDC_POOL, address(delegatedWflrUsdc));
            rewardsDistributor.addPool(WFLR_SFLR_POOL, address(delegatedWflrSflr));
            console.log("Pools added to distributor");

            // 4. Enable delegation on all pools
            delegatedWflrUsdt.enableDelegation();
            delegatedWflrUsdc.enableDelegation();
            delegatedWflrSflr.enableDelegation();
            console.log("Delegation enabled on all pools");
        }

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("FlareRewardsDistributor:", address(rewardsDistributor));
        if (!isMainnet) {
            console.log("DelegatedLBPair (WFLR/USDT):", address(delegatedWflrUsdt));
            console.log("DelegatedLBPair (WFLR/USDC):", address(delegatedWflrUsdc));
            console.log("DelegatedLBPair (WFLR/sFLR):", address(delegatedWflrSflr));
        }
        console.log("=========================================\n");
    }
}

/**
 * @title EnableDelegationSingle
 * @notice Script to enable delegation on a single existing pool
 */
contract EnableDelegationSingle is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolAddress = vm.envAddress("POOL_ADDRESS");
        address ftsoProvider = vm.envAddress("FTSO_PROVIDER");
        address deployer = vm.addr(deployerPrivateKey);

        bool isMainnet = block.chainid == 14;
        address wflr = isMainnet
            ? 0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d
            : 0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273;

        console.log("Creating DelegatedLBPair for pool:", poolAddress);

        vm.startBroadcast(deployerPrivateKey);

        DelegatedLBPair delegatedPair = new DelegatedLBPair(
            poolAddress,
            wflr,
            ftsoProvider,
            deployer
        );

        delegatedPair.enableDelegation();

        vm.stopBroadcast();

        console.log("DelegatedLBPair deployed:", address(delegatedPair));
        console.log("Delegation enabled to:", ftsoProvider);
    }
}

/**
 * @title ChangeFTSOProvider
 * @notice Script to change the FTSO provider for a delegated pool
 */
contract ChangeFTSOProvider is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address delegatedPairAddress = vm.envAddress("DELEGATED_PAIR");
        address newFtsoProvider = vm.envAddress("NEW_FTSO_PROVIDER");

        console.log("Changing FTSO provider for:", delegatedPairAddress);
        console.log("New provider:", newFtsoProvider);

        vm.startBroadcast(deployerPrivateKey);

        DelegatedLBPair delegatedPair = DelegatedLBPair(delegatedPairAddress);
        delegatedPair.setFTSOProvider(newFtsoProvider);

        vm.stopBroadcast();

        console.log("FTSO provider updated successfully");
    }
}

/**
 * @title ClaimRewards
 * @notice Script to claim rewards for a pool
 */
contract ClaimRewards is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address distributorAddress = vm.envAddress("DISTRIBUTOR");
        address poolAddress = vm.envAddress("POOL_ADDRESS");

        console.log("Claiming rewards for pool:", poolAddress);

        vm.startBroadcast(deployerPrivateKey);

        FlareRewardsDistributor distributor = FlareRewardsDistributor(payable(distributorAddress));
        uint256 rewards = distributor.claimAllRewards(poolAddress);

        vm.stopBroadcast();

        console.log("Total rewards claimed:", rewards);
    }
}
