const hre = require("hardhat");

async function main() {
  const Payment = await hre.ethers.getContractFactory("Payment");
  const payment = await Payment.deploy();
  await payment.deployed();
  console.log("payment deployed to:", payment.address);

  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.deployed();
  console.log("mockToken deployed to:", mockToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
