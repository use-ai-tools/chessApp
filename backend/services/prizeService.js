const Contest = require('../models/Contest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PlatformRevenue = require('../models/PlatformRevenue');

const calculateEloChange = (ratingA, ratingB, scoreA, k = 8) => {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  return Math.round(k * (scoreA - expectedA));
};

const unlockAchievement = (user, achievementName) => {
  if (!user.achievements) user.achievements = [];
  if (!user.achievements.includes(achievementName)) {
    user.achievements.push(achievementName);
  }
};

const distributePrize = async (contestId, winnerId, loserId, isDraw = false) => {
  const contest = await Contest.findById(contestId).populate('contestType');
  if (!contest || !contest.contestType) throw new Error('Contest not found');

  const ct = contest.contestType;
  const isFreeMatch = ct.entry === 0;

  let winnerUser = null;
  let loserUser = null;

  if (winnerId) winnerUser = await User.findById(winnerId);
  if (loserId) loserUser = await User.findById(loserId);

  const numMoves = contest.moves ? Math.floor(contest.moves.length / 2) : 0;

  // --- FREE MATCH ELO LOGIC ---
  let winnerNewElo = null;
  let loserNewElo = null;

  if (isFreeMatch) {
    if (winnerUser && loserUser) {
      const p1Elo = winnerUser.elo?.free || 1000;
      const p2Elo = loserUser.elo?.free || 1000;
      
      const p1Change = isDraw ? calculateEloChange(p1Elo, p2Elo, 0.5) : calculateEloChange(p1Elo, p2Elo, 1);
      const p2Change = isDraw ? calculateEloChange(p2Elo, p1Elo, 0.5) : calculateEloChange(p2Elo, p1Elo, 0);

      winnerNewElo = Math.max(100, p1Elo + p1Change);
      loserNewElo = Math.max(100, p2Elo + p2Change);

      await User.findByIdAndUpdate(winnerId, { 'elo.free': winnerNewElo });
      await User.findByIdAndUpdate(loserId, { 'elo.free': loserNewElo });
    }
  } 
  // --- PAID MATCH STATS LOGIC ---
  else {
    const updateStats = async (userId, resultStr) => {
      const u = await User.findById(userId);
      if (!u) return;

      if (!u.paidStats) u.paidStats = { totalMatches: 0, wins: 0, winStreak: 0, currentStreak: 0, avgMovesPerGame: 0, recentResults: [] };
      
      const st = u.paidStats;
      const isWin = resultStr === 'W';
      const isLoss = resultStr === 'L';

      const prevMoves = st.avgMovesPerGame * st.totalMatches;
      st.totalMatches += 1;
      st.avgMovesPerGame = Math.round((prevMoves + numMoves) / st.totalMatches);

      if (isWin) {
        st.wins += 1;
        st.currentStreak = st.currentStreak > 0 ? st.currentStreak + 1 : 1;
        if (st.currentStreak > st.winStreak) st.winStreak = st.currentStreak;
        
        unlockAchievement(u, 'First Win');
        if (st.currentStreak === 5) unlockAchievement(u, '5 Win Streak');
        if (numMoves > 0 && numMoves <= 10) unlockAchievement(u, 'Speed Demon');
      } else if (isLoss) {
        st.currentStreak = st.currentStreak < 0 ? st.currentStreak - 1 : -1;
      } else {
        st.currentStreak = 0;
      }

      st.recentResults.push({ result: resultStr, at: new Date() });
      if (st.recentResults.length > 10) st.recentResults.shift();
      st.lastMatchAt = new Date();

      if (st.totalMatches >= 3) u.unverified = false;
      await u.save();
    };

    if (isDraw) {
      if (winnerId) await updateStats(winnerId, 'D');
      if (loserId) await updateStats(loserId, 'D');
    } else {
      if (winnerId) await updateStats(winnerId, 'W');
      if (loserId) await updateStats(loserId, 'L');
    }

    // --- FINANCIAL PAYOUT LOGIC ---
    if (isDraw) {
      if (winnerId) {
        await User.findByIdAndUpdate(winnerId, { $inc: { wallet: ct.entry } });
        await Transaction.create({ userId: winnerId, amount: ct.entry, type: 'credit', reason: `Draw refund — ${ct.name}`, status: 'completed' });
      }
      if (loserId) {
        await User.findByIdAndUpdate(loserId, { $inc: { wallet: ct.entry } });
        await Transaction.create({ userId: loserId, amount: ct.entry, type: 'credit', reason: `Draw refund — ${ct.name}`, status: 'completed' });
      }
      return { status: 'draw', refunded: true, winnerNewElo, loserNewElo };
    } else if (winnerId) {
      await User.findByIdAndUpdate(winnerId, { $inc: { wallet: ct.payout } });
      await Transaction.create({ userId: winnerId, amount: ct.payout, type: 'credit', reason: `Won match — ${ct.name}`, status: 'completed' });
      
      const totalEntry = ct.entry * 2;
      const platformTakes = Math.max(0, totalEntry - ct.payout);

      if (platformTakes > 0) {
        let rev = await PlatformRevenue.findOne();
        if (!rev) rev = await PlatformRevenue.create({ totalEarnings: 0, pendingTaxes: 0, clearTaxes: 0 });
        rev.totalEarnings += platformTakes;
        rev.pendingTaxes += platformTakes * 0.28;
        rev.lastUpdated = new Date();
        await rev.save();
      }

      return { status: 'won', winnerId, payout: ct.payout, platformTakes, winnerNewElo, loserNewElo };
    }
  }

  return { status: 'completed', winnerNewElo, loserNewElo };
};

module.exports = { distributePrize };
