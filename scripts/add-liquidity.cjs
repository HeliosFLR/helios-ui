const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
const privateKey = '0x19e1d43797e69038fba043ec7a5091c5a96a3e32fabce3eb96da1fa0b57e24ba';
const wallet = new ethers.Wallet(privateKey, provider);

// Contract addresses
const LB_ROUTER = '0xe62c4c776A79cBF66426519f282121684Be4fCdE';

// Tokens
const TOKENS = {
  WFLR: '0x2b8aD1d8f130881d9b23Cb523E2Bccc996f11B4e',
  USDC: '0x5dcA2A1539c2C36335F4B14D0437C1e4065C8434',
  USDT: '0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A',
};

// ABIs
const ROUTER_ABI = [
  'function addLiquidity(tuple(address tokenX, address tokenY, uint256 binStep, uint256 amountX, uint256 amountY, uint256 amountXMin, uint256 amountYMin, uint256 activeIdDesired, uint256 idSlippage, int256[] deltaIds, uint256[] distributionX, uint256[] distributionY, address to, address refundTo, uint256 deadline) liquidityParameters) external returns (uint256 amountXAdded, uint256 amountYAdded, uint256 amountXLeft, uint256 amountYLeft, uint256[] depositIds, uint256[] liquidityMinted)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
];

const router = new ethers.Contract(LB_ROUTER, ROUTER_ABI, wallet);

const BIN_STEP = 15;
const ACTIVE_ID_WFLR_USD = 8385997;  // 1 WFLR = 0.02 USD
const ACTIVE_ID_PRICE_1 = 8388608;  // 1:1 for stablecoins

async function mintTokens(tokenAddr, amount, decimals, name) {
  const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);

  try {
    const balance = await token.balanceOf(wallet.address);
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    if (balance < amountWei) {
      console.log(`Minting ${amount} ${name}...`);
      const tx = await token.mint(wallet.address, amountWei);
      await tx.wait();
      console.log(`Minted ${amount} ${name} ✓`);
    } else {
      console.log(`Already have ${ethers.formatUnits(balance, decimals)} ${name}`);
    }
  } catch (error) {
    console.error(`Error minting ${name}:`, error.message);
  }
}

async function addLiquidity(tokenXAddr, tokenYAddr, amountX, amountY, decimalsX, decimalsY, activeId, poolName) {
  console.log(`\n=== Adding liquidity to ${poolName} ===`);
  console.log(`Amount X: ${amountX}, Amount Y: ${amountY}`);

  try {
    const tokenX = new ethers.Contract(tokenXAddr, ERC20_ABI, wallet);
    const tokenY = new ethers.Contract(tokenYAddr, ERC20_ABI, wallet);

    const amountXWei = ethers.parseUnits(amountX.toString(), decimalsX);
    const amountYWei = ethers.parseUnits(amountY.toString(), decimalsY);

    // Approve tokens
    console.log('Approving tokens...');
    let tx = await tokenX.approve(LB_ROUTER, amountXWei);
    await tx.wait();
    tx = await tokenY.approve(LB_ROUTER, amountYWei);
    await tx.wait();

    // Wider distribution across 11 bins for better price coverage
    const deltaIds = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(d => BigInt(d));

    // X tokens go to bins >= 0 (active bin and above)
    // Y tokens go to bins <= 0 (active bin and below)
    const distributionX = [
      0n, 0n, 0n, 0n, 0n,  // bins -5 to -1: no X
      ethers.parseEther('0.3'),  // bin 0 (active): 30%
      ethers.parseEther('0.25'), // bin 1: 25%
      ethers.parseEther('0.2'),  // bin 2: 20%
      ethers.parseEther('0.15'), // bin 3: 15%
      ethers.parseEther('0.07'), // bin 4: 7%
      ethers.parseEther('0.03'), // bin 5: 3%
    ];

    const distributionY = [
      ethers.parseEther('0.03'), // bin -5: 3%
      ethers.parseEther('0.07'), // bin -4: 7%
      ethers.parseEther('0.15'), // bin -3: 15%
      ethers.parseEther('0.2'),  // bin -2: 20%
      ethers.parseEther('0.25'), // bin -1: 25%
      ethers.parseEther('0.3'),  // bin 0 (active): 30%
      0n, 0n, 0n, 0n, 0n,  // bins 1 to 5: no Y
    ];

    const liquidityParams = {
      tokenX: tokenXAddr,
      tokenY: tokenYAddr,
      binStep: BIN_STEP,
      amountX: amountXWei,
      amountY: amountYWei,
      amountXMin: 0,
      amountYMin: 0,
      activeIdDesired: activeId,
      idSlippage: 20, // Allow more slippage for active ID
      deltaIds: deltaIds,
      distributionX: distributionX,
      distributionY: distributionY,
      to: wallet.address,
      refundTo: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };

    console.log('Adding liquidity...');
    tx = await router.addLiquidity(liquidityParams, { gasLimit: 2000000 });
    console.log(`Tx hash: ${tx.hash}`);
    await tx.wait();
    console.log(`Liquidity added to ${poolName} ✓`);
  } catch (error) {
    console.error(`Error adding liquidity to ${poolName}:`, error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

async function main() {
  console.log('Wallet:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('C2FLR Balance:', ethers.formatEther(balance));

  // Mint more tokens for liquidity
  console.log('\n=== Minting tokens ===');
  await mintTokens(TOKENS.WFLR, '50000', 18, 'WFLR');  // 50k WFLR
  await mintTokens(TOKENS.USDT, '5000', 6, 'USDT');   // 5k USDT
  await mintTokens(TOKENS.USDC, '5000', 6, 'USDC');   // 5k USDC

  // Add substantial liquidity to WFLR/USDT pool
  // 10,000 WFLR + 200 USDT (at 0.02 USD/WFLR price)
  await addLiquidity(
    TOKENS.WFLR, TOKENS.USDT,
    '10000', '200',
    18, 6,
    ACTIVE_ID_WFLR_USD,
    'WFLR/USDT'
  );

  // Add substantial liquidity to USDC/USDT pool
  // 1000 USDC + 1000 USDT (1:1 ratio)
  await addLiquidity(
    TOKENS.USDC, TOKENS.USDT,
    '1000', '1000',
    6, 6,
    ACTIVE_ID_PRICE_1,
    'USDC/USDT'
  );

  console.log('\n========================================');
  console.log('LIQUIDITY ADDITION COMPLETE!');
  console.log('========================================');
}

main().catch(console.error);
