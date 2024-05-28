const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const teamsFilePath = path.join(__dirname, "..", "teams.json");

const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
const TARGET_CONTRACT_ADDRESS = "0xaA3F198893dc661F4273CE6D32F716007681076B";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Granting minter role with the account:", deployer.address);

  if (!fs.existsSync(teamsFilePath)) {
    console.error("Teams file not found!");
    process.exit(1);
  }

  const deployedTeams = JSON.parse(fs.readFileSync(teamsFilePath));

  for (const team of deployedTeams) {
    const Token = await ethers.getContractFactory("Token");
    const token = Token.attach(team.tokenAddress);

    try {
      const tx = await token.grantRole(MINTER_ROLE, TARGET_CONTRACT_ADDRESS);
      await tx.wait();
      console.log(`Granted minter role to ${TARGET_CONTRACT_ADDRESS} for ${team.name} token at address ${team.tokenAddress}`);
    } catch (error) {
      console.error(`Failed to grant minter role for ${team.name} token at address ${team.tokenAddress}:`, error);
    }
  }

  console.log("Minter role granted to all tokens.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});