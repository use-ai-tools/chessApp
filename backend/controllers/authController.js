const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { signToken } = require('../utils/jwt');
const crypto = require('crypto');

const generateReferralCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

exports.signup = async (req, res) => {
  try {
    const { username, password, ref } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
    if (password.length < 4) return res.status(400).json({ message: 'Password must be at least 4 characters' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists' });

    // Fingerprint Check (Anti-Smurf)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const fingerprint = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
    
    let isUnverified = true; // By default new accounts are unverified (need 3 paid matches to clear)
    const identicalDeviceUsers = await User.find({ deviceFingerprint: fingerprint });
    if (identicalDeviceUsers.length > 0) {
      // Flag existing ones just in case they were cleared
      await User.updateMany({ deviceFingerprint: fingerprint }, { unverified: true });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const user = await User.create({
      username,
      password,
      activeSession: sessionId,
      wallet: 1000,
      deviceFingerprint: fingerprint,
      unverified: isUnverified,
      referral: { code: generateReferralCode() }
    });

    // Logging initial bonus
    await Transaction.create({ userId: user._id, amount: 1000, type: 'credit', reason: 'signup bonus', status: 'completed' });

    // Referral processing
    if (ref) {
      const referrer = await User.findOne({ 'referral.code': ref });
      if (referrer) {
        user.referral.referredBy = referrer._id;
        await user.save();

        referrer.referral.referredUsers.push(user._id);
        referrer.referral.totalEarned += 10;
        referrer.wallet += 10;
        await referrer.save();

        await Transaction.create({ userId: referrer._id, amount: 10, type: 'credit', reason: `Referral bonus (${user.username})`, status: 'completed' });
        await Notification.create({ userId: referrer._id, title: 'Referral Bonus!', message: `Your friend ${user.username} joined! ₹10 added.`, type: 'referral' });

        user.wallet += 10;
        await user.save();
        await Transaction.create({ userId: user._id, amount: 10, type: 'credit', reason: 'Referred signup bonus', status: 'completed' });
      }
    }

    const token = signToken(user._id, sessionId);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        wallet: user.wallet,
        elo: user.elo?.free || 1000,
        role: user.role,
        unverified: user.unverified,
        referralCode: user.referral.code
      },
    });
  } catch (error) {
    console.error('[auth] signup error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.banned) return res.status(403).json({ message: 'Account banned. Contact support.' });

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Update fingerprint on login too
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const fingerprint = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
    user.deviceFingerprint = fingerprint;

    const sessionId = crypto.randomBytes(16).toString('hex');
    user.activeSession = sessionId;
    await user.save();

    const token = signToken(user._id, sessionId);
    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        wallet: user.wallet,
        elo: user.elo?.free || 1000,
        role: user.role,
        unverified: user.unverified,
        referralCode: user.referral?.code
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -activeSession');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        wallet: user.wallet,
        elo: user.elo?.free || 1000,
        role: user.role,
        createdAt: user.createdAt,
        avatar: user.avatar,
        achievements: user.achievements,
        paidStats: user.paidStats,
        referralCode: user.referral?.code
      },
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
