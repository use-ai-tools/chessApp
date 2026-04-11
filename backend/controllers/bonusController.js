const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const BONUS_AMOUNTS = [2, 3, 5, 5, 10, 10, 20]; // Days 1 to 7

exports.claimDailyBonus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const lastClaimed = user.dailyBonus?.lastClaimedAt;

    let isNewStreak = false;
    if (lastClaimed) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last = new Date(lastClaimed.getFullYear(), lastClaimed.getMonth(), lastClaimed.getDate());
      const diffTime = Math.abs(today - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return res.status(400).json({ message: 'Bonus already claimed today' });
      } else if (diffDays > 1) {
        isNewStreak = true; // Broken streak
      }
    } else {
      isNewStreak = true;
    }

    if (!user.dailyBonus) user.dailyBonus = { streak: 0 };

    if (isNewStreak) {
      user.dailyBonus.streak = 1;
    } else {
      user.dailyBonus.streak += 1;
      if (user.dailyBonus.streak > 7) user.dailyBonus.streak = 1; // reset after full week
    }

    const bonusAmount = BONUS_AMOUNTS[user.dailyBonus.streak - 1];
    
    user.dailyBonus.lastClaimedAt = now;
    user.wallet += bonusAmount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount: bonusAmount,
      type: 'credit',
      reason: `Daily Bonus Day ${user.dailyBonus.streak}`,
      status: 'completed'
    });

    await Notification.create({
      userId: user._id,
      title: 'Daily Bonus!',
      message: `₹${bonusAmount} added to your wallet! Streak: Day ${user.dailyBonus.streak}/7`,
      type: 'bonus'
    });

    res.json({ message: 'Bonus claimed', amount: bonusAmount, streak: user.dailyBonus.streak, wallet: user.wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
