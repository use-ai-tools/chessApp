require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const Contest = require('../models/Contest');
const Room = require('../models/Room');
const Tournament = require('../models/Tournament');

async function clearHistory() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chessApp';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    
    console.log('Clearing transaction history...');
    const txRes = await Transaction.deleteMany({});
    console.log(`- Deleted ${txRes.deletedCount} transactions`);

    console.log('Clearing match history (Contests)...');
    const contestRes = await Contest.deleteMany({});
    console.log(`- Deleted ${contestRes.deletedCount} contests`);

    console.log('Clearing tournament rooms (Rooms)...');
    const roomRes = await Room.deleteMany({});
    console.log(`- Deleted ${roomRes.deletedCount} rooms`);

    console.log('Clearing tournament history (Tournaments)...');
    const tourneyRes = await Tournament.deleteMany({});
    console.log(`- Deleted ${tourneyRes.deletedCount} tournaments`);

    console.log('\n--- SUCCESS ---');
    console.log('Transaction and match history successfully cleared.');
    console.log('User accounts and wallet balances were NOT affected.');
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear history:', err);
    process.exit(1);
  }
}

clearHistory();
