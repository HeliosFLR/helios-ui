require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    coston2: {
      url: "https://coston2-api.flare.network/ext/C/rpc",
      accounts: ["0x19e1d43797e69038fba043ec7a5091c5a96a3e32fabce3eb96da1fa0b57e24ba"],
      chainId: 114,
    },
  },
};
