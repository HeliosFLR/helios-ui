const { ethers } = require('ethers');
const { readFileSync } = require('fs');
const { join } = require('path');

const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
const privateKey = '0x19e1d43797e69038fba043ec7a5091c5a96a3e32fabce3eb96da1fa0b57e24ba';
const wallet = new ethers.Wallet(privateKey, provider);

// Load bytecode from JSON
const { bytecode } = JSON.parse(readFileSync(join(__dirname, 'bytecode.json'), 'utf8'));

const abi = [
  "constructor(string name_, string symbol_, uint8 decimals_)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

async function main() {
  console.log('Deploying from:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'C2FLR');

  if (balance === 0n) {
    console.log('ERROR: No balance!');
    return;
  }

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Deploy WFLR
  console.log('\nDeploying WFLR...');
  try {
    const wflr = await factory.deploy('Wrapped Flare Test', 'WFLR', 18);
    console.log('WFLR tx hash:', wflr.deploymentTransaction()?.hash);
    await wflr.waitForDeployment();
    const wflrAddress = await wflr.getAddress();
    console.log('WFLR deployed at:', wflrAddress);

    // Deploy USDC
    console.log('\nDeploying USDC...');
    const usdc = await factory.deploy('USD Coin Test', 'USDC', 6);
    console.log('USDC tx hash:', usdc.deploymentTransaction()?.hash);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log('USDC deployed at:', usdcAddress);

    console.log('\n========================================');
    console.log('DEPLOYMENT COMPLETE!');
    console.log('========================================');
    console.log('WFLR:', wflrAddress);
    console.log('USDC:', usdcAddress);
    console.log('========================================');
  } catch (err) {
    console.error('Deployment error:', err.message);
    if (err.data) console.error('Error data:', err.data);
  }
}

main().catch(console.error);
