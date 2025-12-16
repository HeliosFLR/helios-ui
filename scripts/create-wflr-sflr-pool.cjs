const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
const privateKey = '0x19e1d43797e69038fba043ec7a5091c5a96a3e32fabce3eb96da1fa0b57e24ba';
const wallet = new ethers.Wallet(privateKey, provider);

// Contract addresses
const LB_FACTORY = '0xdbfD526E99E458EA640b524cbC671650Be29aFD1';
const LB_ROUTER = '0xe62c4c776A79cBF66426519f282121684Be4fCdE';

// Tokens (both 18 decimals!)
const WFLR = '0x2b8aD1d8f130881d9b23Cb523E2Bccc996f11B4e';
const sFLR = '0xf2F8BDfd3A216f684756768160cb3BFdF26b03f0';

// ABIs
const FACTORY_ABI = [
  'function createLBPair(address tokenX, address tokenY, uint24 activeId, uint16 binStep) external returns (address pair)',
  'function getLBPairInformation(address tokenX, address tokenY, uint256 binStep) external view returns (tuple(uint16 binStep, address LBPair, bool createdByOwner, bool ignoredForRouting))',
];

const ROUTER_ABI = [
  'function addLiquidity(tuple(address tokenX, address tokenY, uint256 binStep, uint256 amountX, uint256 amountY, uint256 amountXMin, uint256 amountYMin, uint256 activeIdDesired, uint256 idSlippage, int256[] deltaIds, uint256[] distributionX, uint256[] distributionY, address to, address refundTo, uint256 deadline) liquidityParameters) external returns (uint256 amountXAdded, uint256 amountYAdded, uint256 amountXLeft, uint256 amountYLeft, uint256[] depositIds, uint256[] liquidityMinted)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
];

const factory = new ethers.Contract(LB_FACTORY, FACTORY_ABI, wallet);
const router = new ethers.Contract(LB_ROUTER, ROUTER_ABI, wallet);

const BIN_STEP = 15;
// For 1:1 ratio (sFLR roughly equals WFLR in value)
const ACTIVE_ID_PRICE_1 = 8388608; // 2^23 = price of 1

async function main() {
  console.log('Wallet:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('C2FLR Balance:', ethers.formatEther(balance));

  // Check if pool exists
  console.log('\n=== Checking WFLR/sFLR pool ===');

  // Sort tokens by address (LB requires tokenX < tokenY)
  const [tokenX, tokenY] = WFLR.toLowerCase() < sFLR.toLowerCase()
    ? [WFLR, sFLR]
    : [sFLR, WFLR];

  console.log('TokenX:', tokenX);
  console.log('TokenY:', tokenY);

  const pairInfo = await factory.getLBPairInformation(tokenX, tokenY, BIN_STEP);

  let poolAddress;
  if (pairInfo.LBPair !== '0x0000000000000000000000000000000000000000') {
    console.log('Pool already exists at:', pairInfo.LBPair);
    poolAddress = pairInfo.LBPair;
  } else {
    console.log('Creating WFLR/sFLR pool...');
    try {
      const tx = await factory.createLBPair(tokenX, tokenY, ACTIVE_ID_PRICE_1, BIN_STEP);
      console.log('Tx hash:', tx.hash);
      await tx.wait();

      const pairInfoAfter = await factory.getLBPairInformation(tokenX, tokenY, BIN_STEP);
      poolAddress = pairInfoAfter.LBPair;
      console.log('Pool created at:', poolAddress);
    } catch (error) {
      console.error('Error creating pool:', error.message);
      return;
    }
  }

  // Mint tokens if needed
  console.log('\n=== Minting tokens ===');
  const wflr = new ethers.Contract(WFLR, ERC20_ABI, wallet);
  const sflr = new ethers.Contract(sFLR, ERC20_ABI, wallet);

  const wflrBalance = await wflr.balanceOf(wallet.address);
  const sflrBalance = await sflr.balanceOf(wallet.address);

  const targetAmount = ethers.parseEther('10000');

  if (wflrBalance < targetAmount) {
    console.log('Minting WFLR...');
    const tx = await wflr.mint(wallet.address, targetAmount);
    await tx.wait();
    console.log('Minted 10000 WFLR');
  } else {
    console.log('WFLR balance:', ethers.formatEther(wflrBalance));
  }

  if (sflrBalance < targetAmount) {
    console.log('Minting sFLR...');
    const tx = await sflr.mint(wallet.address, targetAmount);
    await tx.wait();
    console.log('Minted 10000 sFLR');
  } else {
    console.log('sFLR balance:', ethers.formatEther(sflrBalance));
  }

  // Add liquidity
  console.log('\n=== Adding liquidity to WFLR/sFLR pool ===');

  const amountX = ethers.parseEther('5000');
  const amountY = ethers.parseEther('5000');

  // Approve
  console.log('Approving tokens...');
  let tx = await wflr.approve(LB_ROUTER, amountX);
  await tx.wait();
  tx = await sflr.approve(LB_ROUTER, amountY);
  await tx.wait();

  // Distribution across 11 bins
  const deltaIds = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(d => BigInt(d));

  const distributionX = [
    0n, 0n, 0n, 0n, 0n,
    ethers.parseEther('0.3'),
    ethers.parseEther('0.25'),
    ethers.parseEther('0.2'),
    ethers.parseEther('0.15'),
    ethers.parseEther('0.07'),
    ethers.parseEther('0.03'),
  ];

  const distributionY = [
    ethers.parseEther('0.03'),
    ethers.parseEther('0.07'),
    ethers.parseEther('0.15'),
    ethers.parseEther('0.2'),
    ethers.parseEther('0.25'),
    ethers.parseEther('0.3'),
    0n, 0n, 0n, 0n, 0n,
  ];

  // Determine which token is X and Y for the router
  const [routerTokenX, routerTokenY, routerAmountX, routerAmountY] =
    tokenX.toLowerCase() === WFLR.toLowerCase()
      ? [WFLR, sFLR, amountX, amountY]
      : [sFLR, WFLR, amountY, amountX];

  const liquidityParams = {
    tokenX: routerTokenX,
    tokenY: routerTokenY,
    binStep: BIN_STEP,
    amountX: routerAmountX,
    amountY: routerAmountY,
    amountXMin: 0,
    amountYMin: 0,
    activeIdDesired: ACTIVE_ID_PRICE_1,
    idSlippage: 20,
    deltaIds,
    distributionX,
    distributionY,
    to: wallet.address,
    refundTo: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };

  console.log('Adding liquidity...');
  try {
    tx = await router.addLiquidity(liquidityParams, { gasLimit: 2000000 });
    console.log('Tx hash:', tx.hash);
    await tx.wait();
    console.log('Liquidity added successfully!');
  } catch (error) {
    console.error('Error adding liquidity:', error.message);
  }

  // Test swap
  console.log('\n=== Testing getSwapOut ===');
  const pairAbi = [
    'function getSwapOut(uint128 amountIn, bool swapForY) view returns (uint128 amountInLeft, uint128 amountOut, uint128 fee)',
    'function getTokenX() view returns (address)',
    'function getTokenY() view returns (address)',
  ];
  const pair = new ethers.Contract(poolAddress, pairAbi, provider);

  try {
    const poolTokenX = await pair.getTokenX();
    const poolTokenY = await pair.getTokenY();
    console.log('Pool TokenX:', poolTokenX);
    console.log('Pool TokenY:', poolTokenY);

    const result = await pair.getSwapOut(ethers.parseEther('10'), true);
    console.log('\n10 TokenX -> TokenY:');
    console.log('  amountInLeft:', ethers.formatEther(result.amountInLeft));
    console.log('  amountOut:', ethers.formatEther(result.amountOut));
    console.log('  fee:', ethers.formatEther(result.fee));
  } catch (error) {
    console.error('getSwapOut failed:', error.message);
  }

  console.log('\n========================================');
  console.log('WFLR/sFLR POOL SETUP COMPLETE!');
  console.log('Pool address:', poolAddress);
  console.log('========================================');
}

main().catch(console.error);
