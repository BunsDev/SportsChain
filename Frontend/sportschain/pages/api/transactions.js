// sportschain/pages/api/transactions.js
import dbConnect from '../../lib/mongodb';
import Transaction from '../../lib/Transaction';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { userId, teamId, amount, transactionType, tokenPrice, hash } = req.body;
      const totalValue = amount * tokenPrice;

      // Créez une nouvelle transaction avec le hash fourni
      const newTransaction = new Transaction({
        userId,
        teamId,
        amount,
        transactionType,
        tokenPrice,
        totalValue,
        hash,
      });

      // Sauvegarder la transaction
      await newTransaction.save();

      res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const transactions = await Transaction.find({});
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}