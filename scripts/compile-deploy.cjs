const solc = require('solc');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Read the contract source
const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TestToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

// Compile the contract
const input = {
  language: 'Solidity',
  sources: {
    'TestToken.sol': {
      content: contractSource
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    },
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};

console.log('Compiling contract...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  for (const error of output.errors) {
    console.log(error.formattedMessage);
    if (error.severity === 'error') {
      process.exit(1);
    }
  }
}

const contract = output.contracts['TestToken.sol']['TestToken'];
const bytecode = '0x' + contract.evm.bytecode.object;
const abi = contract.abi;

console.log('Contract compiled successfully!');
console.log('Bytecode length:', bytecode.length);

// Deploy to Coston2
const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
const privateKey = '0x19e1d43797e69038fba043ec7a5091c5a96a3e32fabce3eb96da1fa0b57e24ba';
const wallet = new ethers.Wallet(privateKey, provider);

async function deploy() {
  console.log('\\nDeploying from:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'C2FLR');

  if (balance === 0n) {
    console.log('ERROR: No balance!');
    return;
  }

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Deploy WFLR
  console.log('\\nDeploying WFLR...');
  const wflr = await factory.deploy('Wrapped Flare Test', 'WFLR', 18);
  console.log('WFLR tx hash:', wflr.deploymentTransaction()?.hash);
  await wflr.waitForDeployment();
  const wflrAddress = await wflr.getAddress();
  console.log('WFLR deployed at:', wflrAddress);

  // Deploy USDC
  console.log('\\nDeploying USDC...');
  const usdc = await factory.deploy('USD Coin Test', 'USDC', 6);
  console.log('USDC tx hash:', usdc.deploymentTransaction()?.hash);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log('USDC deployed at:', usdcAddress);

  console.log('\\n========================================');
  console.log('DEPLOYMENT COMPLETE!');
  console.log('========================================');
  console.log('WFLR:', wflrAddress);
  console.log('USDC:', usdcAddress);
  console.log('========================================');

  // Save to file for reference
  fs.writeFileSync('deployed-tokens.json', JSON.stringify({
    WFLR: wflrAddress,
    USDC: usdcAddress
  }, null, 2));
}

deploy().catch(console.error);
