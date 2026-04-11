const Contest = require('../models/Contest');
const ContestType = require('../models/ContestType');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const queues = new Map();
const RESTRICTED_STATES = ['assam', 'odisha', 'telangana', 'andhra pradesh', 'nagaland', 'sikkim'];

const isRestrictedState = (state) => {
  if (!state) return false;
  return RESTRICTED_STATES.includes(state.toLowerCase().trim());
};

const getFairnessScore = (player) => {
  if (!player.paidStats) return 500;
  const { wins, totalMatches, winStreak } = player.paidStats;
  if (totalMatches === 0) return 500;
  const winRate = wins / totalMatches;
  const streakPenalty = winStreak > 3 ? winStreak * 10 : 0;
  return Math.round(winRate * 1000) + streakPenalty;
};

const joinContestQueue = async (userId, contestId, socketId) => {
  const contest = await Contest.findById(contestId).populate('contestType');
  if (!contest || contest.status !== 'open') throw new Error('Contest not available');

  const ct = contest.contestType;
  if (!ct) throw new Error('Invalid contest type');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.banned) throw new Error('Account banned');

  const isFreeMatch = ct.entry === 0;

  if (!isFreeMatch) {
    if (isRestrictedState(user.state)) throw new Error('Real-money gaming not available in your state');
    if (user.wallet < ct.entry) throw new Error(`Insufficient balance. Need ₹${ct.entry}, have ₹${user.wallet}`);
  }

  for (const [_, queue] of queues) {
    if (queue.findIndex(e => e.userId === userId) !== -1) {
      throw new Error('Already in a matchmaking queue. Cancel first.');
    }
  }

  if (!isFreeMatch) {
    user.wallet -= ct.entry;
    await user.save();
    await Transaction.create({
      userId: user._id,
      amount: ct.entry,
      type: 'debit',
      reason: `Entry fee — ${ct.name}`,
      status: 'completed',
    });
  }

  contest.players.push(userId);
  await contest.save();

  const queueKey = ct._id.toString();
  if (!queues.has(queueKey)) queues.set(queueKey, []);
  const queue = queues.get(queueKey);

  const entry = {
    userId,
    socketId,
    isFreeMatch,
    elo: user.elo?.free || 1000,
    fairnessScore: isFreeMatch ? null : getFairnessScore(user),
    unverified: user.unverified || false,
    winStreak: user.paidStats?.winStreak || 0,
    currentStreak: user.paidStats?.currentStreak || 0,
    joinedAt: Date.now(),
    contestId: contest._id.toString(),
  };

  queue.push(entry);

  const matched = tryMatchInQueue(queueKey, entry);
  if (matched) return matched;

  return {
    queued: true,
    contestId: contest._id.toString(),
    position: queue.length,
    elo: entry.elo,
    fairnessScore: entry.fairnessScore,
    contestType: ct,
  };
};

const isMatchable = (p1, p2, maxWait) => {
  if (p1.isFreeMatch) {
    let eloRange = maxWait < 30 ? 200 : maxWait < 60 ? 400 : Infinity;
    return Math.abs(p1.elo - p2.elo) <= eloRange;
  } else {
    let fairnessRange = maxWait < 45 ? 150 : maxWait < 90 ? 300 : Infinity;
    
    if (maxWait < 45) {
      if (p1.unverified !== p2.unverified) return false;
      if (p1.winStreak >= 5 && p2.winStreak < 1) return false;
      if (p2.winStreak >= 5 && p1.winStreak < 1) return false;
      if (p1.currentStreak <= -3 && p2.currentStreak >= 0) return false;
      if (p2.currentStreak <= -3 && p1.currentStreak >= 0) return false;
    }
    return Math.abs(p1.fairnessScore - p2.fairnessScore) <= fairnessRange;
  }
};

const tryMatchInQueue = (queueKey, newEntry) => {
  const queue = queues.get(queueKey);
  if (!queue || queue.length < 2) return null;

  const now = Date.now();
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    if (candidate.userId === newEntry.userId) continue;

    const maxWait = Math.max((now - candidate.joinedAt) / 1000, 0);

    if (isMatchable(newEntry, candidate, maxWait)) {
      const idx1 = queue.indexOf(newEntry);
      if (idx1 !== -1) queue.splice(idx1, 1);
      const idx2 = queue.indexOf(candidate);
      if (idx2 !== -1) queue.splice(idx2, 1);

      return { matched: true, player1: newEntry, player2: candidate };
    }
  }
  return null;
};

const checkQueuesForMatches = () => {
  const matches = [];
  for (const [queueKey, queue] of queues) {
    if (queue.length < 2) continue;

    const now = Date.now();
    for (let i = 0; i < queue.length; i++) {
      for (let j = i + 1; j < queue.length; j++) {
        const p1 = queue[i];
        const p2 = queue[j];
        const maxWait = Math.max((now - p1.joinedAt) / 1000, (now - p2.joinedAt) / 1000);

        if (isMatchable(p1, p2, maxWait)) {
          queue.splice(j, 1);
          queue.splice(i, 1);
          matches.push({ queueKey, player1: p1, player2: p2 });
          break;
        }
      }
      if (matches.length > 0 && matches[matches.length - 1].queueKey === queueKey) break;
    }
  }
  return matches;
};

const leaveContestQueue = async (userId, contestId) => {
  let removed = false;
  for (const [_, queue] of queues) {
    const idx = queue.findIndex(e => e.userId === userId);
    if (idx !== -1) { queue.splice(idx, 1); removed = true; break; }
  }
  if (!removed) return { refunded: false, message: 'Not in queue' };

  const contest = await Contest.findById(contestId).populate('contestType');
  if (contest && contest.status === 'open') {
    contest.players = contest.players.filter(p => p.toString() !== userId);
    await contest.save();

    const ct = contest.contestType;
    if (ct && ct.entry > 0) {
      await User.findByIdAndUpdate(userId, { $inc: { wallet: ct.entry } });
      await Transaction.create({
        userId, amount: ct.entry, type: 'credit',
        reason: `Refund — cancelled queue for ${ct.name}`, status: 'completed',
      });
    }
  }
  return { refunded: true };
};

const leaveAllQueues = async (userId) => {
  const refunds = [];
  for (const [_, queue] of queues) {
    const idx = queue.findIndex(e => e.userId === userId);
    if (idx !== -1) { const entry = queue[idx]; queue.splice(idx, 1); refunds.push(entry); }
  }

  for (const entry of refunds) {
    try {
      const contest = await Contest.findById(entry.contestId).populate('contestType');
      if (contest && contest.status === 'open') {
        contest.players = contest.players.filter(p => p.toString() !== userId);
        await contest.save();
        const ct = contest.contestType;
        if (ct && ct.entry > 0) {
          await User.findByIdAndUpdate(userId, { $inc: { wallet: ct.entry } });
          await Transaction.create({
            userId, amount: ct.entry, type: 'credit',
            reason: `Refund — disconnected from ${ct.name}`, status: 'completed',
          });
        }
      }
    } catch (e) {}
  }
  return refunds.length;
};

const getQueueStatus = (userId) => {
  for (const [queueKey, queue] of queues) {
    const entry = queue.find(e => e.userId === userId);
    if (entry) {
      const waitTime = Math.round((Date.now() - entry.joinedAt) / 1000);
      let range;
      if (entry.isFreeMatch) {
         range = waitTime < 30 ? 200 : waitTime < 60 ? 400 : '∞';
      } else {
         range = waitTime < 45 ? 150 : waitTime < 90 ? 300 : '∞';
      }
      return {
        inQueue: true,
        contestId: entry.contestId,
        position: queue.indexOf(entry) + 1,
        totalInQueue: queue.length,
        elo: entry.elo,
        fairnessScore: entry.fairnessScore,
        range,
        waitTime,
      };
    }
  }
  return { inQueue: false };
};

module.exports = {
  joinContestQueue, leaveContestQueue, leaveAllQueues,
  checkQueuesForMatches, getQueueStatus, isRestrictedState, RESTRICTED_STATES,
};
