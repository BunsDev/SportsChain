import dbConnect from '../../lib/mongodb';
import Player from '../../../../Backend/models/Player';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const players = await Player.find({});
      res.status(200).json({ success: true, data: players });
    } catch (error) {
      console.error('Error fetching players from DB:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
