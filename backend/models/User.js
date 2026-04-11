const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  
  // ELO System
  elo: {
    free: { type: Number, default: 1000 },
  },

  // Paid Matchmaking Stats (Fairness Algo inputs)
  paidStats: {
    totalMatches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    avgMovesPerGame: { type: Number, default: 0 },
    lastMatchAt: { type: Date },
    recentResults: [{ result: String, at: Date }],
  },

  // Anti-smurf and Safety
  unverified: { type: Boolean, default: true },
  deviceFingerprint: { type: String },

  // Wallet
  wallet: { type: Number, default: 0 },
  depositLimit: { type: Number, default: 0 }, // 0 means no limit

  // Compliance
  ageVerified: { type: Boolean, default: false },
  state: { type: String, default: '' },

  // Social & Gamification
  avatar: { type: String, default: '♔' },
  achievements: [{ type: String }],
  
  // Daily Bonus
  dailyBonus: {
    streak: { type: Number, default: 0 },
    lastClaimedAt: { type: Date },
  },

  // Referral System
  referral: {
    code: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalEarned: { type: Number, default: 0 }
  },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
