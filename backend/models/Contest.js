const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  contestType: { type: mongoose.Schema.Types.ObjectId, ref: 'ContestType', required: true },
  status:      { type: String, enum: ['open', 'matched', 'playing', 'completed', 'cancelled'], default: 'open' },
  players:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  winner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loser:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchId:     { type: String },
  fen:         { type: String, default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  moves:       [{ from: String, to: String, san: String, fen: String, ts: Date }],
  result:      { type: String, enum: ['white', 'black', 'draw', null], default: null },
  reason:      { type: String },
  whitePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  blackPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  review:      { type: Object },
  startedAt:   { type: Date },
  endedAt:     { type: Date },
}, { timestamps: true });

contestSchema.index({ status: 1, contestType: 1 });
contestSchema.index({ 'players': 1 });

module.exports = mongoose.model('Contest', contestSchema);
