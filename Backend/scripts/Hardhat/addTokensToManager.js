const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Assurez-vous d'avoir configuré votre modèle de Team
const Team = require("../../models/Team"); // Mettez à jour ce chemin si nécessaire

const teamsFilePath = path.join(__dirname, "..", "teams.json");

// Adresse du contrat TokenManager
const TOKEN_MANAGER_ADDRESS = "0xaA3F198893dc661F4273CE6D32F716007681076B";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const [deployer] = await ethers.getSigners();
  console.log("Adding tokens with the account:", deployer.address);

  if (!fs.existsSync(teamsFilePath)) {
    console.error("Teams file not found!");
    process.exit(1);
  }

  const deployedTeams = JSON.parse(fs.readFileSync(teamsFilePath));
  const tokenManager = await ethers.getContractAt("TokenManager", TOKEN_MANAGER_ADDRESS);

  for (const team of deployedTeams) {
    const teamData = await Team.findOne({ Name: team.name });
    if (teamData) {
      try {
        const tx = await tokenManager.addToken(teamData.TeamId, team.tokenAddress, ethers.utils.parseUnits("1", 18));
        await tx.wait();
        console.log(`Added token for ${team.name} with teamId ${teamData.TeamId} to TokenManager at address ${team.tokenAddress}`);
      } catch (error) {
        console.error(`Failed to add token for ${team.name} with teamId ${teamData.TeamId}:`, error);
      }
    } else {
      console.error(`No team found in database for ${team.name}`);
    }
  }

  mongoose.disconnect();
  console.log("Tokens added to TokenManager.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});