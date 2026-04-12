const mongoose = require('mongoose');
const { checkAndStartTournaments } = require('./controllers/tournamentController');
const Tournament = require('./models/Tournament');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chessApp';

async function testTournamentStart() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // Create a dummy tournament starting NOW
    const now = new Date();
    const t = await Tournament.create({
      name: 'Test Tournament ' + Date.now(),
      entryFee: 10,
      prizePool: 100,
      maxPlayers: 16,
      startTime: now,
      status: 'registering',
      registeredPlayers: []
    });

    console.log('Created test tournament:', t._id);

    // Add 2 dummy players
    const User = require('./models/User');
    const players = await User.find().limit(2);
    if (players.length < 2) {
      console.log('Not enough users in DB to test');
      process.exit(0);
    }
    
    t.registeredPlayers = players.map(p => p._id);
    await t.save();
    console.log('Added 2 players');

    // Manually trigger start
    await checkAndStartTournaments(null);
    
    const updated = await Tournament.findById(t._id);
    console.log('Tournament status:', updated.status);
    
    const Room = require('./models/Room');
    const room = await Room.findOne({ players: { $all: players.map(p => p._id) }, status: 'ongoing' });
    if (room) {
      console.log('Room created successfully:', room.roomId);
      console.log('Match count:', room.matches.length);
    } else {
      console.log('Room NOT created');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testTournamentStart();
