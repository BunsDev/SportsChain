import axios from 'axios';
import dbConnect from '../../lib/mongodb';
import Player from '../../../../Backend/models/Player';

export default async function handler(req, res) {
  const apiKey = process.env.SPORTSDATA_API_KEY;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const response = await axios.get(`https://api.sportsdata.io/v3/soccer/scores/json/Players`, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });

      const players = response.data;

      // Sauvegarder chaque joueur dans la base de données
      await Promise.all(players.map(async (player) => {
        await Player.updateOne(
          { PlayerId: player.PlayerId },
          { $set: player },
          { upsert: true }
        );
      }));

      res.status(200).json({ success: true, data: players });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}