const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

const teamsFilePath = path.join(__dirname, "..", "teams.json");

async function main() {
  if (!fs.existsSync(teamsFilePath)) {
    console.error("Teams file not found!");
    process.exit(1);
  }

  const deployedTeams = JSON.parse(fs.readFileSync(teamsFilePath));
  
  for (const team of deployedTeams) {
    try {
      console.log(`Verifying contract for ${team.name} at address ${team.tokenAddress}`);
      await run("verify:verify", {
        address: team.tokenAddress,
        constructorArguments: [team.name, team.symbol],
      });
      console.log(`Verified contract for ${team.name}`);
    } catch (error) {
      console.error(`Failed to verify contract for ${team.name}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});