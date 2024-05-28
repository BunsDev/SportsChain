const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const teamsFilePath = path.join(__dirname, "..", "teams.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const teams = [
    { name: 'Paris', symbol: 'PSGHG' },
    // Ajoutez d'autres équipes ici
  ];

  let deployedTeams = [];

  if (fs.existsSync(teamsFilePath)) {
    deployedTeams = JSON.parse(fs.readFileSync(teamsFilePath));
  }

  for (const team of teams) {
    const TeamToken = await ethers.getContractFactory("Token");
    const teamToken = await TeamToken.deploy(team.name, team.symbol);
    await teamToken.deployed();

    console.log(`${team.name} Token deployed to:`, teamToken.address);

    deployedTeams.push({
      name: team.name,
      symbol: team.symbol,
      tokenAddress: teamToken.address
    });
  }

  fs.writeFileSync(teamsFilePath, JSON.stringify(deployedTeams, null, 2));

  console.log("Deployment complete. Teams data saved to teams.json.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});