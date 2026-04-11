const mongoose = require('mongoose');

const contestTypeSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  entry:    { type: Number, required: true },
  payout:   { type: Number, required: true },
  platform: { type: Number, required: true },
  active:   { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: total pot = entry * 2
contestTypeSchema.virtual('totalPot').get(function () {
  return this.entry * 2;
});

module.exports = mongoose.model('ContestType', contestTypeSchema);
