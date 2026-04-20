const Contest = require('../models/Contest');
const ContestType = require('../models/ContestType');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { Chess } = require('chess.js');
const { distributePrize } = require('../services/prizeService');
const { analyzeGame } = require('../services/gameReviewService');
const { replenishContests } = require('../scripts/seedContests');
const { nextRound } = require('../services/tournamentService');
const Room = require('../models/Room');

// In-Memory Game State
const games = new Map();         // contestId -> Chess instance + metadata
const userSockets = new Map();   // userId -> socketId
const moveTimers = new Map();    // contestId -> setTimeout handle
const MOVE_TIMEOUT_MS = 30000;

module.exports = (io) => {

  // ── TIMER ──
  const startMoveTimer = (contestId, gameState) => {
    if (moveTimers.has(contestId)) clearTimeout(moveTimers.get(contestId));
    const expiresAt = Date.now() + MOVE_TIMEOUT_MS;
    const timer = setTimeout(async () => {
      try {
        const contest = await Contest.findById(contestId);
        if (!contest || contest.status !== 'playing') return;
        const turn = gameState.chess.turn();
        const loserId = turn === 'w' ? contest.whitePlayer : contest.blackPlayer;
        const winnerId = turn === 'w' ? contest.blackPlayer : contest.whitePlayer;
        await endContest(contestId, winnerId, loserId, 'timeout', gameState);
      } catch (err) { console.error('[timer]', err); }
    }, MOVE_TIMEOUT_MS);
    moveTimers.set(contestId, timer);
    io.to(contestId).emit('timerStart', { contestId, timeMs: MOVE_TIMEOUT_MS, turn: gameState.chess.turn(), startedAt: Date.now(), expiresAt });
  };

  // ── END CONTEST ──
  const endContest = async (contestId, winnerId, loserId, reason, gameState) => {
    try {
      const contest = await Contest.findById(contestId).populate('contestType');
      if (!contest || contest.status === 'completed') return;

      const isDraw = !winnerId && ['draw', 'stalemate', 'repetition', 'insufficient'].includes(reason);
      contest.status = 'completed';
      contest.winner = winnerId || null;
      contest.loser = loserId || null;
      contest.reason = reason;
      contest.endedAt = new Date();
      if (gameState) contest.fen = gameState.chess.fen();

      const sanMoves = (contest.moves || []).map(m => m.san).filter(Boolean);
      if (sanMoves.length > 0) { try { contest.review = analyzeGame(sanMoves); } catch (e) {} }
      await contest.save();

      let prizeResult = null;
      try { prizeResult = await distributePrize(contestId, isDraw ? contest.whitePlayer : winnerId, isDraw ? contest.blackPlayer : loserId, isDraw); } catch (e) {}

      if (moveTimers.has(contestId)) { clearTimeout(moveTimers.get(contestId)); moveTimers.delete(contestId); }
      games.delete(contestId);

      const winner = winnerId ? await User.findById(winnerId).select('username elo wallet').lean() : null;
      const loserUser = loserId ? await User.findById(loserId).select('username elo wallet').lean() : null;
      const playersArr = [contest.whitePlayer?.toString(), contest.blackPlayer?.toString()].filter(Boolean);

      for (const pId of playersArr) {
        const sid = userSockets.get(pId);
        if (!sid) continue;
        const isWinner = winnerId && winnerId.toString() === pId;
        const u = pId === winner?._id?.toString() ? winner : loserUser;
        io.to(sid).emit('matchEnded', {
          contestId, winner: winnerId?.toString() || null, reason, isWinner, isDraw,
          payout: prizeResult?.payout || 0,
          eloChange: contest.contestType?.entry === 0 ? (isWinner ? 15 : -10) : null,
          newElo: u?.elo?.free, newWallet: u?.wallet,
          review: contest.review || null, contestType: contest.contestType?.name,
        });
      }

      if (contest.contestType?._id) await replenishContests(contest.contestType._id);

      // ── TOURNAMENT PROGRESSION ──
      // If this contest was part of a tournament Room, find the room and check for next round
      const room = await Room.findOne({ "matches.contestId": contestId });
      if (room) {
        const matchIndex = room.matches.findIndex(m => m.contestId?.toString() === contestId.toString());
        if (matchIndex !== -1) {
          room.matches[matchIndex].status = 'completed';
          room.matches[matchIndex].winner = winnerId;
          room.matches[matchIndex].endedAt = new Date();
          await room.save();
          
          // Trigger tournament service to check if the round is finished
          await nextRound(room.roomId);
          
          // Emit update to the tournament room
          io.to(room.roomId).emit('tournamentUpdated', { roomId: room.roomId });
        }
      }
    } catch (err) { console.error('[endContest]', err); }
  };

  // ── START MATCH (called when contest has 2 players) ──
  const startMatch = async (contestId) => {
    try {
      const contest = await Contest.findById(contestId).populate('contestType');
      if (!contest || contest.players.length < 2) return;

      const p1 = contest.players[0].toString();
      const p2 = contest.players[1].toString();
      const isP1White = Math.random() < 0.5;
      const whiteId = isP1White ? p1 : p2;
      const blackId = isP1White ? p2 : p1;

      contest.status = 'playing';
      contest.whitePlayer = whiteId;
      contest.blackPlayer = blackId;
      contest.startedAt = new Date();
      await contest.save();

      const chess = new Chess();
      games.set(contestId, { chess, players: [whiteId, blackId], moveCount: 0 });

      const white = await User.findById(whiteId).select('username elo').lean();
      const black = await User.findById(blackId).select('username elo').lean();

      const payload = {
        roomId: contestId,
        contestId,
        whitePlayer: { id: whiteId, username: white?.username, elo: white?.elo?.free },
        blackPlayer: { id: blackId, username: black?.username, elo: black?.elo?.free },
        fen: chess.fen(),
        contestType: contest.contestType,
        moves: [],
      };

      // Join both to socket room AND emit individually as fallback
      const s1 = userSockets.get(p1);
      const s2 = userSockets.get(p2);
      const sock1 = s1 ? io.sockets.sockets.get(s1) : null;
      const sock2 = s2 ? io.sockets.sockets.get(s2) : null;
      if (sock1) sock1.join(contestId);
      if (sock2) sock2.join(contestId);

      // Emit matchStarted to room
      console.log('[matchStarted] emitting to room:', contestId);
      io.to(contestId).emit('matchStarted', payload);

      // Also emit directly to each player's socket as a reliability fallback
      // (handles race condition where socket hasn't joined room yet)
      if (sock1) sock1.emit('matchStarted', payload);
      if (sock2) sock2.emit('matchStarted', payload);

      // Emit game-start with color assignment to each player individually
      if (sock1) sock1.emit('game-start', { color: p1 === whiteId ? 'white' : 'black', contestId });
      if (sock2) sock2.emit('game-start', { color: p2 === whiteId ? 'white' : 'black', contestId });

      console.log(`[match] ${white?.username} vs ${black?.username} | ${contest.contestType?.name} | ${contestId}`);
    } catch (err) { console.error('[startMatch]', err); }
  };

  // ═══════════════════════════════════════════════
  // SOCKET HANDLERS
  // ═══════════════════════════════════════════════
  io.on('connection', (socket) => {

    socket.on('identify', ({ userId }) => {
      if (!userId) return;
      if (userSockets.has(userId)) {
        const old = userSockets.get(userId);
        io.to(old).emit('forceLogout', 'Disconnected by new login');
        io.sockets.sockets.get(old)?.disconnect(true);
      }
      userSockets.set(userId, socket.id);
    });

    // ── JOIN ROOM (reconnection support) ──
    socket.on('joinRoom', async ({ roomId, userId }) => {
      socket.join(roomId);
      // Update userSockets mapping in case it was lost
      if (userId) userSockets.set(userId, socket.id);
      try {
        const contest = await Contest.findById(roomId).populate('players').populate('contestType');
        if (!contest) return;
        if ((contest.status === 'playing' || contest.status === 'completed') && contest.players.length >= 2) {
          const gameState = games.get(roomId);
          // Properly map white/black player usernames by matching IDs
          const whiteId = contest.whitePlayer?.toString();
          const blackId = contest.blackPlayer?.toString();
          const whitePl = contest.players.find(p => p._id.toString() === whiteId);
          const blackPl = contest.players.find(p => p._id.toString() === blackId);

          const payload = {
            roomId: contest._id.toString(),
            contestId: contest._id.toString(),
            fen: gameState ? gameState.chess.fen() : (contest.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
            whitePlayer: { id: whiteId, username: whitePl?.username || 'Player', elo: whitePl?.elo?.free || 1200 },
            blackPlayer: { id: blackId, username: blackPl?.username || 'Player', elo: blackPl?.elo?.free || 1200 },
            contestType: contest.contestType,
            moves: (contest.moves || []).map(m => m.san).filter(Boolean),
          };

          io.to(roomId).emit('matchStarted', payload);
          console.log(`[joinRoom] Re-emitted matchStarted to room ${roomId} (triggered by ${userId})`);
        }
      } catch (err) { console.error('[joinRoom]', err); }
    });

    // ═══════════════════════════════════════════════
    // SIMPLE JOIN CONTEST
    // User sends contestTypeId → we find an open contest → add player → if 2 → start
    // ═══════════════════════════════════════════════
    socket.on('joinContest', async ({ contestTypeId, userId }) => {
      try {
        if (!contestTypeId || !userId) return socket.emit('contestError', { message: 'Missing data' });

        const ct = await ContestType.findById(contestTypeId);
        if (!ct) return socket.emit('contestError', { message: 'Contest type not found' });

        const user = await User.findById(userId);
        if (!user) return socket.emit('contestError', { message: 'User not found' });
        if (user.banned) return socket.emit('contestError', { message: 'Account banned' });

        // Check if user already in an open/playing contest of this type
        const existing = await Contest.findOne({
          contestType: contestTypeId,
          players: userId,
          status: { $in: ['open', 'playing'] },
        });
        if (existing) {
          // Already in one — just navigate them there
          socket.emit('joinedContest', { contestId: existing._id.toString() });
          return;
        }

        // Wallet check
        if (ct.entry > 0 && user.wallet < ct.entry) {
          return socket.emit('contestError', { message: `Insufficient balance. Need ₹${ct.entry}, have ₹${user.wallet}` });
        }

        // Deduct wallet
        if (ct.entry > 0) {
          user.wallet -= ct.entry;
          await user.save();
          await Transaction.create({ userId, amount: ct.entry, type: 'debit', reason: `Entry fee — ${ct.name}`, status: 'completed' });
          socket.emit('walletUpdate', { wallet: user.wallet });
        }

        // Atomically find an open contest and add the player
        const contest = await Contest.findOneAndUpdate(
          { contestType: contestTypeId, status: 'open', 'players.1': { $exists: false } },
          { $push: { players: userId } },
          { new: true, sort: { createdAt: 1, _id: 1 } }
        ).populate('contestType');

        if (!contest) {
          // Refund — no open slot found
          if (ct.entry > 0) { user.wallet += ct.entry; await user.save(); }
          return socket.emit('contestError', { message: 'No open contests available. Try again.' });
        }

        console.log(`[join] ${user.username} → ${ct.name} (${contest.players.length}/2) | ${contest._id}`);
        io.emit('contestUpdated', { contestTypeId: contestTypeId.toString(), players: contest.players.length });

        if (contest.players.length >= 2) {
          // 2 players → start match!
          socket.emit('joinedContest', { contestId: contest._id.toString(), waiting: false });
          await startMatch(contest._id.toString());
        } else {
          // 1st player — tell them to wait, navigate to room
          socket.emit('joinedContest', { contestId: contest._id.toString(), waiting: true });
        }
      } catch (err) {
        console.error('[joinContest]', err);
        socket.emit('contestError', { message: err.message || 'Failed to join' });
      }
    });

    // ── LEAVE CONTEST (before match starts) ──
    socket.on('leaveContest', async ({ contestId, userId }) => {
      try {
        const contest = await Contest.findById(contestId).populate('contestType');
        if (!contest || contest.status !== 'open') return;
        contest.players = contest.players.filter(p => p.toString() !== userId);
        await contest.save();
        const ct = contest.contestType;
        if (ct && ct.entry > 0) {
          await User.findByIdAndUpdate(userId, { $inc: { wallet: ct.entry } });
          await Transaction.create({ userId, amount: ct.entry, type: 'credit', reason: `Refund — left ${ct.name}`, status: 'completed' });
        }
        const u = await User.findById(userId).select('wallet').lean();
        socket.emit('contestLeft', { refunded: true });
        if (u) socket.emit('walletUpdate', { wallet: u.wallet });
        io.emit('contestUpdated', { contestTypeId: ct?._id?.toString() });
      } catch (err) { console.error('[leaveContest]', err); }
    });

    // ── PLAYER READY ──
    socket.on('playerReady', async ({ contestId, userId }) => {
      // Game is already started — just start the timer
      const gameState = games.get(contestId);
      if (!gameState) return;
      // Start timer on first move instead
      io.to(contestId).emit('gameReady', { contestId });
    });

    // ── MAKE MOVE ──
    socket.on('makeMove', async ({ contestId, from, to, promotion, playerId }) => {
      try {
        const gameState = games.get(contestId);
        if (!gameState) return socket.emit('errorMsg', 'Game not found');
        const contest = await Contest.findById(contestId);
        if (!contest || contest.status !== 'playing') return;

        const turnBefore = gameState.chess.turn();
        const expected = turnBefore === 'w' ? contest.whitePlayer?.toString() : contest.blackPlayer?.toString();
        if (expected !== playerId) return socket.emit('invalidMove', { reason: 'Not your turn' });

        const move = gameState.chess.move({ from, to, promotion: promotion || 'q' });
        if (!move) return socket.emit('invalidMove', { reason: `${from}-${to} is not legal` });

        gameState.moveCount = (gameState.moveCount || 0) + 1;
        contest.moves.push({ from, to, san: move.san, fen: gameState.chess.fen(), ts: new Date() });
        contest.fen = gameState.chess.fen();

        const chess = gameState.chess;
        // Check game end
        if (chess.in_checkmate()) {
          const loserColor = chess.turn();
          const winnerId = loserColor === 'w' ? contest.blackPlayer : contest.whitePlayer;
          const loserId = loserColor === 'w' ? contest.whitePlayer : contest.blackPlayer;
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: chess.fen(), inCheck: true, captured: move.captured || null, isCheckmate: true });
          await contest.save();
          await endContest(contestId, winnerId, loserId, 'checkmate', gameState);
          return;
        }
        if (chess.in_stalemate()) {
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: chess.fen() });
          await contest.save(); await endContest(contestId, null, null, 'stalemate', gameState); return;
        }
        if (chess.in_threefold_repetition()) {
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: chess.fen() });
          await contest.save(); await endContest(contestId, null, null, 'repetition', gameState); return;
        }
        if (chess.insufficient_material()) {
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: chess.fen() });
          await contest.save(); await endContest(contestId, null, null, 'insufficient', gameState); return;
        }

        await contest.save();
        startMoveTimer(contestId, gameState);
        io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: chess.fen(), inCheck: chess.in_check(), captured: move.captured || null });
      } catch (err) { console.error('[makeMove]', err); }
    });

    socket.on('resign', async ({ contestId, playerId }) => {
      try {
        const contest = await Contest.findById(contestId);
        if (!contest || contest.status !== 'playing') return;
        const winnerId = contest.whitePlayer?.toString() === playerId ? contest.blackPlayer : contest.whitePlayer;
        await endContest(contestId, winnerId, playerId, 'resigned', games.get(contestId));
      } catch (err) {}
    });

    socket.on('drawOffer', ({ contestId, playerId }) => {
      const gs = games.get(contestId);
      if (!gs) return;
      const opId = gs.players.find(p => p !== playerId);
      if (opId) { const s = userSockets.get(opId); if (s) io.to(s).emit('drawOffer', { contestId }); }
    });

    socket.on('drawResponse', async ({ contestId, playerId, accepted }) => {
      if (!accepted) {
        const gs = games.get(contestId);
        if (gs) { const ofId = gs.players.find(p => p !== playerId); if (ofId) { const s = userSockets.get(ofId); if (s) io.to(s).emit('drawDeclined', { contestId }); } }
        return;
      }
      await endContest(contestId, null, null, 'draw', games.get(contestId));
    });

    socket.on('emojiReaction', ({ contestId, emoji, playerId }) => { io.to(contestId).emit('emojiReaction', { emoji, playerId }); });
    socket.on('matchChat', ({ contestId, message, username }) => { io.to(contestId).emit('matchChat', { message, username, ts: Date.now() }); });
    socket.on('lobbyChat', ({ message, username }) => { io.emit('lobbyChat', { message, username, ts: Date.now() }); });
    socket.on('ping_check', () => { socket.emit('pong_check'); });

    socket.on('getReview', async ({ contestId }) => {
      try {
        const contest = await Contest.findById(contestId);
        if (!contest) return;
        if (contest.review) { socket.emit('reviewData', { contestId, review: contest.review }); return; }
        const sans = (contest.moves || []).map(m => m.san).filter(Boolean);
        if (sans.length > 0) { const r = analyzeGame(sans); contest.review = r; await contest.save(); socket.emit('reviewData', { contestId, review: r }); }
      } catch (err) {}
    });

    socket.on('disconnect', async () => {
      let uid = null;
      for (const [u, s] of userSockets.entries()) { if (s === socket.id) { uid = u; userSockets.delete(u); break; } }
      if (!uid) return;

      // Refund from open contests
      try {
        const openContests = await Contest.find({ players: uid, status: 'open' }).populate('contestType');
        for (const c of openContests) {
          c.players = c.players.filter(p => p.toString() !== uid);
          await c.save();
          if (c.contestType?.entry > 0) {
            await User.findByIdAndUpdate(uid, { $inc: { wallet: c.contestType.entry } });
            await Transaction.create({ userId: uid, amount: c.contestType.entry, type: 'credit', reason: `Refund — disconnect`, status: 'completed' });
          }
          io.emit('contestUpdated', { contestTypeId: c.contestType?._id?.toString() });
        }
      } catch (e) { console.error('[disconnect refund]', e); }

      // Active games — opponent wins after 15s
      for (const [cid, gs] of games) {
        if (gs.players.includes(uid)) {
          const wid = gs.players.find(p => p !== uid);
          setTimeout(async () => {
            if (!userSockets.has(uid)) await endContest(cid, wid, uid, 'disconnect', gs);
          }, 15000);
        }
      }
    });
  });
};
