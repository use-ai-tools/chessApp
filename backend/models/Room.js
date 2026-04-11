const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['waiting', 'playing', 'completed', 'forfeited'], default: 'waiting' },
  round: { type: Number, default: 1 },
  moves: [{ fen: String, from: String, to: String, san: String, createdAt: Date, durationMs: Number }],
  startedAt: Date,
  endedAt: Date,
  review: { type: Object }, // Game review data { classifications, white, black, summary }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Chess Contest' },
  maxPlayers: { type: Number, default: 10 },
  entryFee: { type: Number, default: 49 },
  prizeDistribution: { type: String, enum: ['top4', 'winnerTA'], default: 'top4' },
  status: { type: String, enum: ['waiting', 'ongoing', 'completed'], default: 'waiting' },
  startTime: { type: Date },
  endTime: { type: Date },
  currentRound: { type: Number, default: 1 },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matches: [matchSchema],
  isQuickMatch: { type: Boolean, default: false },
  timeControl: { type: Number, default: 3 }, // minutes
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
