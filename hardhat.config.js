require("@nomiclabs/hardhat-waffle");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balances", "Prints the list of account balances", async () => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    let balance = await hre.ethers.provider.getBalance(account.address);
    balance = balance / 1000000000000000000;
    console.log(account.address, "=>", balance.toString());
  }
});

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
  },
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
