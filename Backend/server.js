const express = require('express');
const cors = require('cors');
const dbConnect = require('./lib/mongodb');
const Player = require('./models/Player');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware pour gérer les requêtes JSON
app.use(express.json());

// Middleware pour gérer les requêtes CORS
app.use(cors());

// Route pour récupérer les joueurs depuis la base de données
app.get('/api/getPlayers', async (req, res) => {
  await dbConnect();
  try {
    const players = await Player.find({});
    res.status(200).json({ success: true, data: players });
  } catch (error) {
    console.error('Error fetching players from DB:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
