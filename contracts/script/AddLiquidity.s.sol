// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ILBRouter {
    struct LiquidityParameters {
        address tokenX;
        address tokenY;
        uint256 binStep;
        uint256 amountX;
        uint256 amountY;
        uint256 amountXMin;
        uint256 amountYMin;
        uint256 activeIdDesired;
        uint256 idSlippage;
        int256[] deltaIds;
        uint256[] distributionX;
        uint256[] distributionY;
        address to;
        address refundTo;
        uint256 deadline;
    }

    function addLiquidity(LiquidityParameters calldata liquidityParameters)
        external
        returns (
            uint256 amountXAdded,
            uint256 amountYAdded,
            uint256 amountXLeft,
            uint256 amountYLeft,
            uint256[] memory depositIds,
            uint256[] memory liquidityMinted
        );
}

contract AddLiquidity is Script {
    address constant ROUTER = 0xe62c4c776A79cBF66426519f282121684Be4fCdE;

    // Tokens
    address constant WFLR = 0x58AD50724a983240D69072DE9c554ff1E12fedd7;
    address constant USDC = 0x4Fcbcfab3109809b0BCcCB42c82cC4E281e71C12;
    address constant USDT = 0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A;
    address constant SFLR = 0xf2F8BDfd3A216f684756768160cb3BFdF26b03f0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address wallet = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Approve all tokens for router
        IERC20(WFLR).approve(ROUTER, type(uint256).max);
        IERC20(USDC).approve(ROUTER, type(uint256).max);
        IERC20(USDT).approve(ROUTER, type(uint256).max);
        IERC20(SFLR).approve(ROUTER, type(uint256).max);

        ILBRouter router = ILBRouter(ROUTER);

        // Single bin liquidity (activeId = 8388608 for 1:1 price)
        int256[] memory deltaIds = new int256[](1);
        deltaIds[0] = 0;

        uint256[] memory distributionX = new uint256[](1);
        distributionX[0] = 1e18; // 100%

        uint256[] memory distributionY = new uint256[](1);
        distributionY[0] = 1e18; // 100%

        uint256 deadline = block.timestamp + 3600;

        // 1. Add liquidity to WFLR/USDC pool (binStep 15)
        // Pool: tokenX=WFLR, tokenY=USDC
        // Using 0.5 WFLR and 100 USDC
        console.log("Adding liquidity to WFLR/USDC pool...");
        ILBRouter.LiquidityParameters memory params1 = ILBRouter.LiquidityParameters({
            tokenX: WFLR,  // pool tokenX is WFLR
            tokenY: USDC,  // pool tokenY is USDC
            binStep: 15,
            amountX: 500000000000000000, // 0.5 WFLR
            amountY: 100 * 1e6,          // 100 USDC
            amountXMin: 0,
            amountYMin: 0,
            activeIdDesired: 8388608,
            idSlippage: 10,
            deltaIds: deltaIds,
            distributionX: distributionX,
            distributionY: distributionY,
            to: wallet,
            refundTo: wallet,
            deadline: deadline
        });
        router.addLiquidity(params1);
        console.log("WFLR/USDC liquidity added!");

        // 2. Add liquidity to sFLR/WFLR pool (binStep 15)
        // Pool: tokenX=SFLR, tokenY=WFLR
        // Using 100 sFLR and 0.1 WFLR
        console.log("Adding liquidity to sFLR/WFLR pool...");
        ILBRouter.LiquidityParameters memory params2 = ILBRouter.LiquidityParameters({
            tokenX: SFLR,  // pool tokenX is SFLR
            tokenY: WFLR,  // pool tokenY is WFLR
            binStep: 15,
            amountX: 100 * 1e18,          // 100 sFLR
            amountY: 100000000000000000,  // 0.1 WFLR
            amountXMin: 0,
            amountYMin: 0,
            activeIdDesired: 8388608,
            idSlippage: 10,
            deltaIds: deltaIds,
            distributionX: distributionX,
            distributionY: distributionY,
            to: wallet,
            refundTo: wallet,
            deadline: deadline
        });
        router.addLiquidity(params2);
        console.log("sFLR/WFLR liquidity added!");

        // 3. Add liquidity to USDC/USDT pool (binStep 15)
        // USDC is tokenX (lower address), USDT is tokenY (higher address)
        // Using 1000 USDC and 1000 USDT (stablecoin pair)
        console.log("Adding liquidity to USDC/USDT pool...");
        ILBRouter.LiquidityParameters memory params3 = ILBRouter.LiquidityParameters({
            tokenX: USDC,  // lower address is tokenX
            tokenY: USDT,  // higher address is tokenY
            binStep: 15,
            amountX: 1000 * 1e6,  // 1000 USDC
            amountY: 1000 * 1e6,  // 1000 USDT
            amountXMin: 0,
            amountYMin: 0,
            activeIdDesired: 8388608,
            idSlippage: 10,
            deltaIds: deltaIds,
            distributionX: distributionX,
            distributionY: distributionY,
            to: wallet,
            refundTo: wallet,
            deadline: deadline
        });
        router.addLiquidity(params3);
        console.log("USDC/USDT liquidity added!");

        vm.stopBroadcast();

        console.log("All liquidity added successfully!");
    }
}
