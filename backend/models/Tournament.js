const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  entryFee: { type: Number, required: true },
  prizePool: { type: Number, required: true },
  maxPlayers: { type: Number, required: true },
  registeredPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  startTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'registering', 'in_progress', 'completed'], 
    default: 'upcoming' 
  },
  
  // Single elimination brackets representation
  brackets: [{
    round: Number,
    matches: [{
      whitePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      blackPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' }
    }]
  }],

  winners: [{
    position: Number,
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prize: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
