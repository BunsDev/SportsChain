const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const teamsFilePath = path.join(__dirname, "..", "teams.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const teams = [
    { name: 'Paris Saint-Germain FC', symbol: 'PSG' },
    { name: 'Olympique Lyonnais', symbol: 'OL' },
    { name: 'Olympique de Marseille', symbol: 'OM' },
    { name: 'AS Monaco FC', symbol: 'ASM' },
    { name: 'Lille OSC', symbol: 'LOSC' },
    { name: 'OGC Nice', symbol: 'OGCN' },
    { name: 'Stade Rennais FC', symbol: 'SRFC' },
    { name: 'RC Strasbourg Alsace', symbol: 'RCSA' },
    { name: 'FC Nantes', symbol: 'FCN' },
    { name: 'Montpellier HSC', symbol: 'MHSC' },
    { name: 'Stade Brestois 29', symbol: 'SB29' },
    { name: 'Girondins de Bordeaux', symbol: 'GB' },
    { name: 'AS Saint-Étienne', symbol: 'ASSE' },
    { name: 'FC Metz', symbol: 'FCM' },
    { name: 'Stade de Reims', symbol: 'SDR' },
    { name: 'Angers SCO', symbol: 'SCO' },
    { name: 'Toulouse FC', symbol: 'TFC' },
    { name: 'Clermont Foot', symbol: 'CF63' },
    { name: 'ESTAC Troyes', symbol: 'ESTAC' },
    { name: 'FC Lorient', symbol: 'FCL' }
  ];

  let deployedTeams = [];

  if (fs.existsSync(teamsFilePath)) {
    deployedTeams = JSON.parse(fs.readFileSync(teamsFilePath));
  }

  for (const team of teams) {
    const TeamToken = await ethers.getContractFactory("Token");
    const teamToken = await TeamToken.deploy(team.name, team.symbol);
    await teamToken.waitForDeployment();

    console.log(`${team.name} Token deployed to:`, teamToken.target);

    deployedTeams.push({
      name: team.name,
      symbol: team.symbol,
      tokenAddress: teamToken.target
    });
  }

  fs.writeFileSync(teamsFilePath, JSON.stringify(deployedTeams, null, 2));

  console.log("Deployment complete. Teams data saved to teams.json.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});