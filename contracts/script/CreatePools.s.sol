// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ILBFactory {
    function createLBPair(
        address tokenX,
        address tokenY,
        uint24 activeId,
        uint16 binStep
    ) external returns (address pair);
}

contract CreatePools is Script {
    address constant FACTORY = 0xdbfD526E99E458EA640b524cbC671650Be29aFD1;
    address constant WFLR = 0x58AD50724a983240D69072DE9c554ff1E12fedd7;
    address constant USDC = 0x4Fcbcfab3109809b0BCcCB42c82cC4E281e71C12;
    address constant USDT = 0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A;
    address constant SFLR = 0xf2F8BDfd3A216f684756768160cb3BFdF26b03f0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        ILBFactory factory = ILBFactory(FACTORY);
        
        // Create sFLR/WFLR pool with binStep 15
        // sFLR ~ WFLR price ratio is ~1:1, use center bin
        console.log("Creating sFLR/WFLR pool...");
        address pair1 = factory.createLBPair(SFLR, WFLR, 8388608, 15);
        console.log("sFLR/WFLR pool created at:", pair1);
        
        // Create USDC/USDT pool with binStep 15
        // Stablecoins are 1:1, use center bin
        console.log("Creating USDC/USDT pool...");
        address pair2 = factory.createLBPair(USDC, USDT, 8388608, 15);
        console.log("USDC/USDT pool created at:", pair2);

        vm.stopBroadcast();
    }
}
