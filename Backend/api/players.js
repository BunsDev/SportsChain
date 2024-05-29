import dbConnect from '../../lib/mongodb';
import Player from '../../models/Player';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const players = await Player.find({});
      res.status(200).json({ success: true, data: players });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
