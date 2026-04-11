const mongoose = require('mongoose');

const platformRevenueSchema = new mongoose.Schema({
  date:        { type: Date, required: true, index: true },
  contestId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  contestType: { type: String },
  amount:      { type: Number, required: true },
  entry:       { type: Number },
  payout:      { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('PlatformRevenue', platformRevenueSchema);
