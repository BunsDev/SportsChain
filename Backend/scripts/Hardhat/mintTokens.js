const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const teamsFilePath = path.join(__dirname, "..", "teams.json");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting tokens with the account:", deployer.address);

  if (!fs.existsSync(teamsFilePath)) {
    console.error("Teams file not found. Make sure to deploy the contracts first.");
    process.exit(1);
  }

  const deployedTeams = JSON.parse(fs.readFileSync(teamsFilePath));
  const mintAmount = "1000000000000000000000000000"; // 1 billion tokens

  for (const team of deployedTeams) {
    const teamToken = await hre.ethers.getContractAt("Token", team.tokenAddress);

    // Mint 1 billion tokens to the deployer address
    const mintTx = await teamToken.mint(deployer.address, mintAmount);
    await mintTx.wait();

    console.log(`Minted 1 billion tokens for ${team.name} at address ${team.tokenAddress}`);
  }

  console.log("Minting complete for all teams.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});