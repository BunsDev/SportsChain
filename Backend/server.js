const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware pour gérer les requêtes JSON
app.use(express.json());

// Middleware pour gérer les requêtes CORS
app.use(cors());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Modèles Mongoose
const Player = require('./models/Player');
const Team = require('./models/Team');

// Route pour récupérer les joueurs depuis la base de données
app.get('/api/getPlayers', async (req, res) => {
  try {
    const players = await Player.find({});
    res.status(200).json({ success: true, data: players });
  } catch (error) {
    console.error('Error fetching players from DB:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour récupérer les équipes depuis la base de données et le fichier JSON
const teamsFilePath = path.join(__dirname, 'config', 'teams.json');

app.get('/api/teams', async (req, res) => {
  try {
    // Récupérer les équipes depuis MongoDB
    console.log('Fetching teams from MongoDB');
    const teamsFromDb = await Team.find({});
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

    res.status(200).json({ data: combinedTeams });
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Gérer les erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});