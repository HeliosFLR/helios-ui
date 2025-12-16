const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "C2FLR");

  // Deploy WFLR
  console.log("\nDeploying WFLR...");
  const WFLR = await hre.ethers.getContractFactory("TestToken");
  const wflr = await WFLR.deploy("Wrapped Flare Test", "WFLR", 18);
  await wflr.waitForDeployment();
  const wflrAddress = await wflr.getAddress();
  console.log("WFLR deployed at:", wflrAddress);

  // Deploy USDC
  console.log("\nDeploying USDC...");
  const USDC = await hre.ethers.getContractFactory("TestToken");
  const usdc = await USDC.deploy("USD Coin Test", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("USDC deployed at:", usdcAddress);

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("WFLR:", wflrAddress);
  console.log("USDC:", usdcAddress);
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
