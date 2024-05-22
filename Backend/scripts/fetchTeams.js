const fetch = require('node-fetch');
const dbConnect = require('../lib/mongodb.js');
const Team = require('../models/Team.js');
const Player = require('../models/Player.js');

const SPORTS_DATA_API_KEY = process.env.SPORTSDATA_API_KEY || "67d847224f214f198713d5f9d290c7c5";
const API_BASE_URL = 'https://api.sportsdata.io/v4/soccer/scores/json'; // URL de base de l'API

console.log(`Using API Key: ${SPORTS_DATA_API_KEY}`);

async function fetchTeamsAndPlayers() {
  console.log('Starting fetchTeamsAndPlayers...');

  const competitions = [
    { competition: 'FRL1', name: 'Ligue 1' }, // Ajoutez d'autres compétitions si besoin
    // Ajoutez d'autres compétitions ici
  ];

  for (const { competition, name } of competitions) {
    console.log(`Fetching teams for competition: ${name}`);

    try {
      const teamsResponse = await fetch(`${API_BASE_URL}/Teams/${competition}?key=${SPORTS_DATA_API_KEY}`);
      console.log(`Teams API response status: ${teamsResponse.status}`);
      if (!teamsResponse.ok) {
        console.error(`Failed to fetch teams for competition: ${name}. Status: ${teamsResponse.status}`);
        continue;
      }
      const teamsData = await teamsResponse.json();
      console.log(`Fetched ${teamsData.length} teams for ${name}`);
      console.log(teamsData); // Log the teams data

      await dbConnect(); // Connexion à la base de données
      console.log('Connected to database');

      for (const teamData of teamsData) {
        console.log(`Fetching players for team: ${teamData.Name}`);
        console.log(`Team Data:`, teamData); // Log the team data to see available fields
        const teamId = teamData.TeamId; // Assurez-vous d'utiliser le bon champ pour l'identifiant d'équipe
        console.log(`Team ID: ${teamId}`);

        if (!teamId) {
          console.error(`Invalid team ID for team: ${teamData.Name}. Skipping...`);
          continue;
        }

        const url = `${API_BASE_URL}/PlayersByTeam/${competition}/${teamId}?key=${SPORTS_DATA_API_KEY}`;
        console.log(`Fetching URL: ${url}`);

        // Récupérer les joueurs de l'équipe
        const playersResponse = await fetch(url);
        console.log(`Players API response status: ${playersResponse.status}`);
        if (playersResponse.status === 404) {
          console.warn(`Players not found for team: ${teamData.Name}. Skipping...`);
          continue;
        } else if (playersResponse.status === 400) {
          const errorText = await playersResponse.text();
          console.error(`Failed to fetch players for team: ${teamData.Name}. Status: ${playersResponse.status}. Error: ${errorText}`);
          continue;
        } else if (!playersResponse.ok) {
          console.error(`Failed to fetch players for team: ${teamData.Name}. Status: ${playersResponse.status}`);
          continue;
        }
        const playersData = await playersResponse.json();
        console.log(`Fetched ${playersData.length} players for team: ${teamData.Name}`);
        console.log(playersData); // Log the players data

        const playerIds = [];

        // Enregistrer ou mettre à jour chaque joueur
        for (const playerData of playersData) {
          console.log(`Updating player: ${playerData.Name}`);
          const player = await Player.findOneAndUpdate(
            { PlayerId: playerData.PlayerID },
            { $set: playerData },
            { upsert: true, new: true }
          );
          playerIds.push(player._id);
        }

        // Créer ou mettre à jour l'équipe avec ses joueurs
        console.log(`Updating team: ${teamData.Name}`);
        await Team.findOneAndUpdate(
          { TeamId: teamData.TeamId }, // Recherche par teamId
          { 
            $set: { 
              ...teamData, 
              Players: playerIds 
            }
          },
          { upsert: true, new: true } // Crée l'équipe si elle n'existe pas
        );
      }
    } catch (error) {
      console.error(`Error fetching or processing data for competition: ${name}`, error);
    }
  }

  console.log('Données des équipes et joueurs mises à jour avec succès !');
}

fetchTeamsAndPlayers().then(() => {
  console.log('fetchTeamsAndPlayers execution completed.');
}).catch((error) => {
  console.error('Error in fetchTeamsAndPlayers execution:', error);
});

module.exports = fetchTeamsAndPlayers;