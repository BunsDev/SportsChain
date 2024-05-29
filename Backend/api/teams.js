const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Team = require('../models/Team');

const teamsFilePath = path.join(__dirname, '..', 'config', 'teams.json');

router.get('/', async (req, res) => {
  try {
    // Récupérer les équipes depuis MongoDB
    console.log('Fetching teams from MongoDB');
    const teamsFromDb = await Team.find();
    console.log('Teams from DB:', teamsFromDb);

    // Lire les adresses de tokens depuis le fichier JSON
    console.log('Reading token addresses from JSON file');
    const teamsFromJson = JSON.parse(fs.readFileSync(teamsFilePath, 'utf-8'));
    console.log('Teams from JSON:', teamsFromJson);

    // Combiner les données
    const combinedTeams = teamsFromDb.map(team => {
      const tokenData = teamsFromJson.find(t => t.name === team.Name);
      return {
        teamId: team.TeamId,
        name: team.Name,
        areaId: team.AreaId,
        tokenAddress: tokenData ? tokenData.tokenAddress : null
      };
    });
    console.log('Combined teams:', combinedTeams);

    res.json({ data: combinedTeams });
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

module.exports = router;