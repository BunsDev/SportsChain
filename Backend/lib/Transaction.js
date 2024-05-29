// sportschain/lib/Transaction.js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  teamId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionType: {
    type: String,
    required: true,
  },
  tokenPrice: {
    type: Number,
    required: true,
  },
  totalValue: {
    type: Number,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);