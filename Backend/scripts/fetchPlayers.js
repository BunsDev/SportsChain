const fetch = require('node-fetch');
const dbConnect = require('../lib/mongodb');
const Player = require('../models/Player');

const SPORTS_DATA_API_KEY = process.env.SPORTSDATA_API_KEY;
const API_BASE_URL = 'https://api.sportsdata.io/v4/soccer/scores/json';

async function fetchPlayers() {
  console.log('Starting fetchPlayers...');

  await dbConnect();
  console.log('Connected to database');

  try {
    const response = await fetch(`${API_BASE_URL}/Players?key=${SPORTS_DATA_API_KEY}`);
    console.log(`Players API response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Failed to fetch players. Status: ${response.status}`);
      return;
    }

    const playersData = await response.json();
    console.log(`Fetched ${playersData.length} players.`);

    await Promise.all(playersData.map(async (playerData) => {
      try {
        await Player.updateOne(
          { PlayerId: playerData.PlayerId },
          { $set: playerData },
          { upsert: true }
        );
      } catch (error) {
        console.error(`Failed to update player: ${playerData.Name}. Error: ${error}`);
      }
    }));

    console.log('Données des joueurs mises à jour avec succès !');
  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
}

fetchPlayers().then(() => {
  console.log('fetchPlayers execution completed.');
}).catch((error) => {
  console.error('Error in fetchPlayers execution:', error);
});
