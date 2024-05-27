import axios from 'axios';
import dbConnect from '../../lib/mongodb';
import Team from '../../../../Backend/models/Team';

export default async function handler(req, res) {
  const apiKey = process.env.SPORTSDATA_API_KEY;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const response = await axios.get(`https://api.sportsdata.io/v3/soccer/scores/json/Teams`, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey }
      });

      const teams = response.data;

      // Sauvegarder chaque équipe dans la base de données
      await Promise.all(teams.map(async (team) => {
        await Team.updateOne(
          { TeamId: team.TeamId },
          { $set: team },
          { upsert: true }
        );
      }));

      res.status(200).json({ success: true, data: teams });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}