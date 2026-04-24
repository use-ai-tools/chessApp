const mongoose = require('mongoose');

const contestTypeSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  entry:    { type: Number, required: true },
  payout:   { type: Number, required: true },
  platform: { type: Number, required: true },
  playersCount: { type: Number, default: 2 },
  timeControl:  { type: Number, default: 10 },
  active:   { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: total pot = entry * playersCount
contestTypeSchema.virtual('totalPot').get(function () {
  return this.entry * (this.playersCount || 2);
});

module.exports = mongoose.model('ContestType', contestTypeSchema);
