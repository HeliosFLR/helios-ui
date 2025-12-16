const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
const privateKey = '0x19e1d43797e69038fba043ec7a5091c5a96a3e32fabce3eb96da1fa0b57e24ba';
const wallet = new ethers.Wallet(privateKey, provider);

// Contract addresses
const LB_FACTORY = '0xdbfD526E99E458EA640b524cbC671650Be29aFD1';
const LB_ROUTER = '0xe62c4c776A79cBF66426519f282121684Be4fCdE';

// New mintable tokens
const TOKENS = {
  WFLR: '0x2b8aD1d8f130881d9b23Cb523E2Bccc996f11B4e',
  USDC: '0x5dcA2A1539c2C36335F4B14D0437C1e4065C8434',
  USDT: '0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A',
  sFLR: '0xf2F8BDfd3A216f684756768160cb3BFdF26b03f0',
};

// ABIs
const FACTORY_ABI = [
  'function createLBPair(address tokenX, address tokenY, uint24 activeId, uint16 binStep) external returns (address pair)',
  'function getLBPairInformation(address tokenX, address tokenY, uint256 binStep) external view returns (tuple(uint16 binStep, address LBPair, bool createdByOwner, bool ignoredForRouting))',
  'function getNumberOfLBPairs() external view returns (uint256)',
];

const ROUTER_ABI = [
  'function addLiquidity(tuple(address tokenX, address tokenY, uint256 binStep, uint256 amountX, uint256 amountY, uint256 amountXMin, uint256 amountYMin, uint256 activeIdDesired, uint256 idSlippage, int256[] deltaIds, uint256[] distributionX, uint256[] distributionY, address to, address refundTo, uint256 deadline) liquidityParameters) external returns (uint256 amountXAdded, uint256 amountYAdded, uint256 amountXLeft, uint256 amountYLeft, uint256[] depositIds, uint256[] liquidityMinted)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

const factory = new ethers.Contract(LB_FACTORY, FACTORY_ABI, wallet);
const router = new ethers.Contract(LB_ROUTER, ROUTER_ABI, wallet);

// Default bin step for all pools
const BIN_STEP = 15;

// Active ID calculation for price = 1 (for stablecoins)
// For LB: price = (1 + binStep/10000)^(activeId - 2^23)
// For price = 1: activeId = 2^23 = 8388608
const ACTIVE_ID_PRICE_1 = 8388608;

// For WFLR, let's say 1 WFLR = 0.02 USD (test price)
// activeId = 2^23 + log(price) / log(1 + binStep/10000)
// For price = 0.02: activeId ≈ 8388608 + log(0.02)/log(1.0015) ≈ 8388608 - 2611 = 8385997
const ACTIVE_ID_WFLR_USD = 8385997;

// For sFLR/WFLR, assume 1:1 ratio
const ACTIVE_ID_SFLR_WFLR = 8388608;

async function checkAndCreatePool(tokenXAddr, tokenYAddr, activeId, name) {
  console.log(`\n=== Checking ${name} pool ===`);

  try {
    // Check if pool exists
    const pairInfo = await factory.getLBPairInformation(tokenXAddr, tokenYAddr, BIN_STEP);

    if (pairInfo.LBPair !== '0x0000000000000000000000000000000000000000') {
      console.log(`Pool already exists at: ${pairInfo.LBPair}`);
      return pairInfo.LBPair;
    }

    console.log(`Creating ${name} pool...`);
    const tx = await factory.createLBPair(tokenXAddr, tokenYAddr, activeId, BIN_STEP);
    console.log(`Tx hash: ${tx.hash}`);
    const receipt = await tx.wait();

    // Get the created pool address
    const pairInfoAfter = await factory.getLBPairInformation(tokenXAddr, tokenYAddr, BIN_STEP);
    console.log(`Pool created at: ${pairInfoAfter.LBPair}`);
    return pairInfoAfter.LBPair;
  } catch (error) {
    console.error(`Error creating ${name} pool:`, error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    return null;
  }
}

async function mintTokens(tokenAddr, amount, decimals) {
  const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);

  try {
    const balance = await token.balanceOf(wallet.address);
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    if (balance < amountWei) {
      console.log(`Minting ${amount} tokens...`);
      const tx = await token.mint(wallet.address, amountWei);
      await tx.wait();
      console.log('Minted successfully');
    } else {
      console.log(`Already have enough tokens (${ethers.formatUnits(balance, decimals)})`);
    }
  } catch (error) {
    console.error('Error minting:', error.message);
  }
}

async function addLiquidity(tokenXAddr, tokenYAddr, amountX, amountY, decimalsX, decimalsY, poolName) {
  console.log(`\n=== Adding liquidity to ${poolName} ===`);

  try {
    const tokenX = new ethers.Contract(tokenXAddr, ERC20_ABI, wallet);
    const tokenY = new ethers.Contract(tokenYAddr, ERC20_ABI, wallet);

    const amountXWei = ethers.parseUnits(amountX.toString(), decimalsX);
    const amountYWei = ethers.parseUnits(amountY.toString(), decimalsY);

    // Approve tokens
    console.log('Approving tokenX...');
    let tx = await tokenX.approve(LB_ROUTER, amountXWei);
    await tx.wait();

    console.log('Approving tokenY...');
    tx = await tokenY.approve(LB_ROUTER, amountYWei);
    await tx.wait();

    // Get active ID for this pool (we'll use the one we set)
    const pairInfo = await factory.getLBPairInformation(tokenXAddr, tokenYAddr, BIN_STEP);
    if (pairInfo.LBPair === '0x0000000000000000000000000000000000000000') {
      console.log('Pool does not exist, skipping liquidity');
      return;
    }

    // For simple uniform liquidity: distribute across 5 bins centered at active ID
    const deltaIds = [-2, -1, 0, 1, 2].map(d => BigInt(d));
    const distributionX = [0, 0, ethers.parseEther('0.5'), ethers.parseEther('0.25'), ethers.parseEther('0.25')];
    const distributionY = [ethers.parseEther('0.25'), ethers.parseEther('0.25'), ethers.parseEther('0.5'), 0, 0];

    // Determine active ID based on pool type
    let activeId;
    if (poolName.includes('USDC/USDT')) {
      activeId = ACTIVE_ID_PRICE_1;
    } else if (poolName.includes('sFLR/WFLR')) {
      activeId = ACTIVE_ID_SFLR_WFLR;
    } else {
      activeId = ACTIVE_ID_WFLR_USD;
    }

    const liquidityParams = {
      tokenX: tokenXAddr,
      tokenY: tokenYAddr,
      binStep: BIN_STEP,
      amountX: amountXWei,
      amountY: amountYWei,
      amountXMin: 0,
      amountYMin: 0,
      activeIdDesired: activeId,
      idSlippage: 10,
      deltaIds: deltaIds,
      distributionX: distributionX,
      distributionY: distributionY,
      to: wallet.address,
      refundTo: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };

    console.log('Adding liquidity...');
    tx = await router.addLiquidity(liquidityParams, { gasLimit: 1000000 });
    console.log(`Tx hash: ${tx.hash}`);
    await tx.wait();
    console.log('Liquidity added successfully!');
  } catch (error) {
    console.error(`Error adding liquidity to ${poolName}:`, error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

async function main() {
  console.log('Deploying from:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'C2FLR');

  // First, mint tokens we need
  console.log('\n=== Minting test tokens ===');
  await mintTokens(TOKENS.WFLR, '10000', 18);
  await mintTokens(TOKENS.USDC, '10000', 6);
  await mintTokens(TOKENS.USDT, '10000', 6);
  await mintTokens(TOKENS.sFLR, '10000', 18);

  // Create pools
  const pools = [];

  // 1. WFLR/USDT
  const wflrUsdt = await checkAndCreatePool(TOKENS.WFLR, TOKENS.USDT, ACTIVE_ID_WFLR_USD, 'WFLR/USDT');
  if (wflrUsdt) pools.push({ name: 'WFLR/USDT', address: wflrUsdt, tokenX: TOKENS.WFLR, tokenY: TOKENS.USDT });

  // 2. WFLR/USDC
  const wflrUsdc = await checkAndCreatePool(TOKENS.WFLR, TOKENS.USDC, ACTIVE_ID_WFLR_USD, 'WFLR/USDC');
  if (wflrUsdc) pools.push({ name: 'WFLR/USDC', address: wflrUsdc, tokenX: TOKENS.WFLR, tokenY: TOKENS.USDC });

  // 3. sFLR/WFLR
  const sflrWflr = await checkAndCreatePool(TOKENS.sFLR, TOKENS.WFLR, ACTIVE_ID_SFLR_WFLR, 'sFLR/WFLR');
  if (sflrWflr) pools.push({ name: 'sFLR/WFLR', address: sflrWflr, tokenX: TOKENS.sFLR, tokenY: TOKENS.WFLR });

  // 4. USDC/USDT
  const usdcUsdt = await checkAndCreatePool(TOKENS.USDC, TOKENS.USDT, ACTIVE_ID_PRICE_1, 'USDC/USDT');
  if (usdcUsdt) pools.push({ name: 'USDC/USDT', address: usdcUsdt, tokenX: TOKENS.USDC, tokenY: TOKENS.USDT });

  // Add liquidity to each pool
  console.log('\n=== Adding initial liquidity ===');

  // WFLR/USDT: 500 WFLR + 10 USDT (assuming 1 WFLR = 0.02 USDT)
  await addLiquidity(TOKENS.WFLR, TOKENS.USDT, '500', '10', 18, 6, 'WFLR/USDT');

  // WFLR/USDC: 500 WFLR + 10 USDC
  await addLiquidity(TOKENS.WFLR, TOKENS.USDC, '500', '10', 18, 6, 'WFLR/USDC');

  // sFLR/WFLR: 100 sFLR + 100 WFLR (1:1 ratio)
  await addLiquidity(TOKENS.sFLR, TOKENS.WFLR, '100', '100', 18, 18, 'sFLR/WFLR');

  // USDC/USDT: 100 USDC + 100 USDT (1:1 ratio)
  await addLiquidity(TOKENS.USDC, TOKENS.USDT, '100', '100', 6, 6, 'USDC/USDT');

  // Print summary
  console.log('\n========================================');
  console.log('POOL DEPLOYMENT COMPLETE!');
  console.log('========================================');
  for (const pool of pools) {
    console.log(`${pool.name}: ${pool.address}`);
  }
  console.log('========================================');
}

main().catch(console.error);
