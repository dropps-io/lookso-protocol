import { ethers } from "hardhat";

async function main() {
  console.log("Deploying LSP19PostValidator");
  const LooksoValidator = await ethers.getContractFactory("LSP19PostValidator");
  const looksoValidator = await LooksoValidator.deploy();

  await looksoValidator.deployed();

  console.log(`Contract deployed at the address: ${looksoValidator.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
