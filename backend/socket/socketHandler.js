const Contest = require('../models/Contest');
const ContestType = require('../models/ContestType');
const Room = require('../models/Room');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { Chess } = require('chess.js');
const { distributePrize } = require('../services/prizeService');
const { analyzeGame } = require('../services/gameReviewService');
const { replenishContests } = require('../scripts/seedContests');

// In-Memory Game State
const games = new Map();         // contestId -> { chess, players, turn, lastMoveAt, moveCount }
const userSockets = new Map();   // userId -> socketId
const moveTimers = new Map();    // contestId -> setTimeout handle
const playersReady = new Map();  // contestId -> Set of userIds
const pendingDrawOffers = new Map();
const MOVE_TIMEOUT_MS = 30000;

module.exports = (io) => {

  // ─────────────────────────────────────────────────────────────
  // BUG 6 FIX: Timer only starts after White's first move
  // ─────────────────────────────────────────────────────────────
  const startMoveTimer = (contestId, gameState) => {
    if (moveTimers.has(contestId)) clearTimeout(moveTimers.get(contestId));

    const expiresAt = Date.now() + MOVE_TIMEOUT_MS;

    const timer = setTimeout(async () => {
      try {
        const contest = await Contest.findById(contestId).populate('contestType');
        if (!contest || contest.status !== 'playing') return;

        // BUG 1 FIX: chess.turn() = the player whose turn it is = the player who timed out = the LOSER
        const turn = gameState.chess.turn();
        const loserId = turn === 'w' ? contest.whitePlayer : contest.blackPlayer;
        const winnerId = turn === 'w' ? contest.blackPlayer : contest.whitePlayer;

        await endContest(contestId, winnerId, loserId, 'timeout', gameState);
      } catch (err) {
        console.error('[timer] timeout error:', err);
      }
    }, MOVE_TIMEOUT_MS);

    moveTimers.set(contestId, timer);

    io.to(contestId).emit('timerStart', {
      contestId,
      timeMs: MOVE_TIMEOUT_MS,
      turn: gameState.chess.turn(),
      startedAt: Date.now(),
      expiresAt,
    });
  };

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
      if (sanMoves.length > 0) {
        try { contest.review = analyzeGame(sanMoves); } catch (e) {}
      }
      await contest.save();

      let prizeResult = null;
      try {
        prizeResult = await distributePrize(
          contestId,
          isDraw ? contest.whitePlayer : winnerId,
          isDraw ? contest.blackPlayer : loserId,
          isDraw,
        );
      } catch (e) {}

      if (moveTimers.has(contestId)) { clearTimeout(moveTimers.get(contestId)); moveTimers.delete(contestId); }
      games.delete(contestId);
      playersReady.delete(contestId);
      pendingDrawOffers.delete(contestId);

      const winner = winnerId ? await User.findById(winnerId).select('username elo wallet').lean() : null;
      const loserUser = loserId ? await User.findById(loserId).select('username elo wallet').lean() : null;
      const playersArr = [contest.whitePlayer?.toString(), contest.blackPlayer?.toString()].filter(Boolean);

      for (const pId of playersArr) {
        const sid = userSockets.get(pId);
        if (!sid) continue;

        const isWinner = winnerId && winnerId.toString() === pId;
        const u = pId === winner?._id?.toString() ? winner : loserUser;
        const myElo = u?.elo?.free;
        const myWallet = u?.wallet;

        io.to(sid).emit('matchEnded', {
          contestId,
          winner: winnerId?.toString() || null,
          reason,
          isWinner,
          isDraw,
          payout: prizeResult?.payout || 0,
          eloChange: contest.contestType?.entry === 0 
              ? (isWinner ? (prizeResult?.winnerNewElo - myElo) : (prizeResult?.loserNewElo - myElo))
              : null,
          newElo: myElo,
          newWallet: myWallet,
          review: contest.review || null,
          contestType: contest.contestType?.name,
        });
      }

      // Auto-renew: create new contest of same type so lobby always has joinable contests
      if (contest.contestType?._id) await replenishContests(contest.contestType._id);
    } catch (err) {
      console.error('[endContest] error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SIMPLE DIRECT MATCH START (no matchmaking queue)
  // Called when a contest has 2 players — immediately starts the game
  // ─────────────────────────────────────────────────────────────
  const startMatch = async (contestId) => {
    try {
      const contest = await Contest.findById(contestId).populate('contestType');
      if (!contest || contest.players.length < 2) return;

      const player1Id = contest.players[0].toString();
      const player2Id = contest.players[1].toString();

      // Random color assignment
      const isP1White = Math.random() < 0.5;
      const whiteId = isP1White ? player1Id : player2Id;
      const blackId = isP1White ? player2Id : player1Id;

      contest.status = 'playing';
      contest.whitePlayer = whiteId;
      contest.blackPlayer = blackId;
      contest.startedAt = new Date();
      contest.matchId = contest._id.toString();
      await contest.save();

      const chess = new Chess();
      // BUG 6: moveCount tracks total moves — timer only starts after first move
      const gameState = { chess, players: [whiteId, blackId], turn: 'w', lastMoveAt: Date.now(), moveCount: 0 };
      games.set(contest._id.toString(), gameState);

      const white = await User.findById(whiteId).select('username elo').lean();
      const black = await User.findById(blackId).select('username elo').lean();
      const ct = contest.contestType;

      const matchPayload = {
        contestId: contest._id.toString(),
        whitePlayer: { id: whiteId, username: white?.username, elo: white?.elo?.free },
        blackPlayer: { id: blackId, username: black?.username, elo: black?.elo?.free },
        fen: chess.fen(),
        contestType: ct,
      };

      // Join both players to the socket room
      const s1 = userSockets.get(player1Id);
      const s2 = userSockets.get(player2Id);
      if (s1) { const sock1 = io.sockets.sockets.get(s1); if (sock1) sock1.join(contest._id.toString()); }
      if (s2) { const sock2 = io.sockets.sockets.get(s2); if (sock2) sock2.join(contest._id.toString()); }

      // Notify both players opponent found
      if (s1) io.to(s1).emit('opponentFound', {
        opponent: { username: player1Id === whiteId ? black?.username : white?.username, elo: player1Id === whiteId ? black?.elo?.free : white?.elo?.free },
        contestId: contest._id.toString(),
        countdown: 3,
      });
      if (s2) io.to(s2).emit('opponentFound', {
        opponent: { username: player2Id === whiteId ? black?.username : white?.username, elo: player2Id === whiteId ? black?.elo?.free : white?.elo?.free },
        contestId: contest._id.toString(),
        countdown: 3,
      });

      // After 3 second countdown, emit matchStarted
      // BUG 6: Don't start move timer here — wait for first move
      setTimeout(() => {
        io.to(contest._id.toString()).emit('matchStarted', matchPayload);
      }, 3000);

      console.log(`[match] Started: ${white?.username} vs ${black?.username} | Contest: ${ct?.name} | ID: ${contest._id}`);
      return contest;
    } catch (err) {
      console.error('[startMatch] error:', err);
    }
  };

  io.on('connection', (socket) => {
    socket.on('identify', ({ userId }) => {
      if (!userId) return;
      if (userSockets.has(userId)) {
        const old = userSockets.get(userId);
        io.to(old).emit('forceLogout', 'You have been disconnected by new login');
        io.sockets.sockets.get(old)?.disconnect(true);
      }
      userSockets.set(userId, socket.id);
    });

    // ─────────────────────────────────────────────────────────────
    // JOIN ROOM (Direct Room Match Trigger)
    // ─────────────────────────────────────────────────────────────
    socket.on('joinRoom', async ({ roomId, userId }) => {
      socket.join(roomId);

      try {
        // Try to find the document as a Room first
        const room = await Room.findById(roomId).populate('players');
        
        if (room) {
          if (room.players.length >= room.maxPlayers && room.status === 'ongoing') {
            const [p1, p2] = room.players;
            io.to(roomId).emit('matchStarted', {
              roomId: room._id.toString(),
              matchId: room._id.toString(),
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              whitePlayerId: p1._id.toString(),
              blackPlayerId: p2._id.toString(),
              whitePlayer: { id: p1._id, username: p1.username },
              blackPlayer: { id: p2._id, username: p2.username },
            });
          }
          return;
        }

        // If not a Room, try as a Contest
        const contest = await Contest.findById(roomId).populate('players');
        if (contest) {
          if (contest.players.length >= 2 && contest.status === 'playing') {
            const [p1, p2] = contest.players;
            // Re-send game state for reconnection
            const gameState = games.get(roomId);
            socket.emit('matchStarted', {
              contestId: contest._id.toString(),
              roomId: contest._id.toString(),
              fen: gameState ? gameState.chess.fen() : (contest.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
              whitePlayer: { id: contest.whitePlayer?.toString(), username: p1._id.toString() === contest.whitePlayer?.toString() ? p1.username : p2.username },
              blackPlayer: { id: contest.blackPlayer?.toString(), username: p1._id.toString() === contest.blackPlayer?.toString() ? p1.username : p2.username },
              contestType: contest.contestType,
              // Send existing moves for reconnection
              moves: (contest.moves || []).map(m => m.san).filter(Boolean),
            });
          }
        }
      } catch (err) {
        console.error('[joinRoom] error:', err);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // SIMPLE JOIN CONTEST (replaces broken matchmaking queue)
    // ─────────────────────────────────────────────────────────────
    socket.on('joinContest', async ({ contestId, userId }) => {
      try {
        const contest = await Contest.findById(contestId).populate('contestType');
        if (!contest) return socket.emit('contestError', { message: 'Contest not found' });
        if (contest.status !== 'open') return socket.emit('contestError', { message: 'Contest not available' });

        const ct = contest.contestType;
        if (!ct) return socket.emit('contestError', { message: 'Invalid contest type' });

        // Check if already in this contest
        if (contest.players.some(p => p.toString() === userId)) {
          return socket.emit('contestError', { message: 'Already joined this contest' });
        }

        const user = await User.findById(userId);
        if (!user) return socket.emit('contestError', { message: 'User not found' });
        if (user.banned) return socket.emit('contestError', { message: 'Account banned' });

        // Wallet check & deduction for paid contests
        if (ct.entry > 0) {
          if (user.wallet < ct.entry) {
            return socket.emit('contestError', { message: `Insufficient balance. Need ₹${ct.entry}, have ₹${user.wallet}` });
          }
          user.wallet -= ct.entry;
          await user.save();

          await Transaction.create({
            userId: user._id,
            amount: ct.entry,
            type: 'debit',
            reason: `Entry fee — ${ct.name}`,
            status: 'completed',
          });

          // Send updated wallet to the joining player
          socket.emit('walletUpdate', { wallet: user.wallet });
        }

        // Add player to contest atomically to prevent race condition
        const updatedContest = await Contest.findOneAndUpdate(
          { _id: contestId, status: 'open', $expr: { $lt: [{ $size: "$players" }, 2] } },
          { $push: { players: userId } },
          { new: true }
        ).populate('contestType');

        if (!updatedContest) {
          // If update failed, it was filled or cancelled while we checked. Refund.
          if (ct.entry > 0) {
             user.wallet += ct.entry;
             await user.save();
          }
          return socket.emit('contestError', { message: 'Contest is full or no longer available' });
        }

        console.log(`[join] ${user.username} joined ${ct.name} (${updatedContest.players.length}/2) | Contest: ${updatedContest._id}`);

        // Notify lobby watchers that contest was updated
        io.emit('contestUpdated', { contestId: updatedContest._id.toString(), players: updatedContest.players.length });

        // If 2 players → start match!
        if (updatedContest.players.length >= 2) {
          await startMatch(updatedContest._id.toString());
        } else {
          // 1st player joined, waiting for opponent
          socket.emit('waitingForOpponent', {
            contestId: updatedContest._id.toString(),
            contestType: ct,
            message: 'Waiting for opponent...',
          });
        }
      } catch (err) {
        console.error('[joinContest] error:', err);
        socket.emit('contestError', { message: err.message || 'Failed to join contest' });
      }
    });

    // ─────────────────────────────────────────────────────────────
    // LEAVE CONTEST (before match starts — refund entry fee)
    // ─────────────────────────────────────────────────────────────
    socket.on('leaveContest', async ({ contestId, userId }) => {
      try {
        const contest = await Contest.findById(contestId).populate('contestType');
        if (!contest || contest.status !== 'open') {
          return socket.emit('contestError', { message: 'Cannot leave this contest' });
        }

        // Remove player
        contest.players = contest.players.filter(p => p.toString() !== userId);
        await contest.save();

        // Refund entry fee
        const ct = contest.contestType;
        if (ct && ct.entry > 0) {
          await User.findByIdAndUpdate(userId, { $inc: { wallet: ct.entry } });
          await Transaction.create({
            userId,
            amount: ct.entry,
            type: 'credit',
            reason: `Refund — left ${ct.name}`,
            status: 'completed',
          });
        }

        const updatedUser = await User.findById(userId).select('wallet').lean();
        socket.emit('contestLeft', { refunded: true });
        if (updatedUser) socket.emit('walletUpdate', { wallet: updatedUser.wallet });

        // Notify lobby
        io.emit('contestUpdated', { contestId: contest._id.toString(), players: contest.players.length });
        console.log(`[leave] Player ${userId} left ${ct?.name} | Contest: ${contest._id}`);
      } catch (err) {
        console.error('[leaveContest] error:', err);
        socket.emit('contestError', { message: err.message || 'Failed to leave contest' });
      }
    });

    socket.on('playerReady', async ({ contestId, userId }) => {
      try {
        if (!playersReady.has(contestId)) playersReady.set(contestId, new Set());
        playersReady.get(contestId).add(userId);
        const gameState = games.get(contestId);
        if (!gameState) return;
        if (playersReady.get(contestId).size >= 2) {
          // BUG 6: Don't start timer on playerReady — wait for first move
          // Just emit gameReady so UI knows both players are ready
          io.to(contestId).emit('gameReady', { contestId });
        }
      } catch (err) {}
    });

    // ─────────────────────────────────────────────────────────────
    // MAKE MOVE — BUG 1 FIX: Correct winner declaration
    // BUG 6 FIX: Timer starts only after White's first move
    // ─────────────────────────────────────────────────────────────
    socket.on('makeMove', async ({ contestId, from, to, promotion, playerId }) => {
      try {
        const gameState = games.get(contestId);
        if (!gameState) return socket.emit('errorMsg', 'Game not found');

        const contest = await Contest.findById(contestId);
        if (!contest || contest.status !== 'playing') return;

        // Validate it's this player's turn
        const turnBefore = gameState.chess.turn();
        const expectedPlayer = turnBefore === 'w' ? contest.whitePlayer?.toString() : contest.blackPlayer?.toString();
        if (expectedPlayer !== playerId) return socket.emit('invalidMove', { reason: 'Not your turn' });

        const move = gameState.chess.move({ from, to, promotion: promotion || 'q' });
        if (!move) return socket.emit('invalidMove', { reason: `${from}-${to} is not legal` });

        gameState.lastMoveAt = Date.now();
        gameState.moveCount = (gameState.moveCount || 0) + 1;
        pendingDrawOffers.delete(contestId);

        contest.moves.push({ from, to, san: move.san, fen: gameState.chess.fen(), ts: new Date() });
        contest.fen = gameState.chess.fen();

        // ── BUG 1 FIX: Check game end AFTER the move ──
        // After a move, chess.turn() returns the NEXT player's turn
        // If checkmate: chess.turn() = the player in checkmate = LOSER
        if (gameState.chess.isCheckmate()) {
          const loserColor = gameState.chess.turn(); // whose turn it is now = the one in checkmate = LOSER
          const winnerId = loserColor === 'w' ? contest.blackPlayer : contest.whitePlayer;
          const loserId = loserColor === 'w' ? contest.whitePlayer : contest.blackPlayer;

          // Emit the final move before ending
          io.to(contestId).emit('moveMade', {
            contestId, from, to, san: move.san,
            fen: gameState.chess.fen(),
            inCheck: true,
            captured: move.captured || null,
            isCheckmate: true,
          });

          await contest.save();
          await endContest(contestId, winnerId, loserId, 'checkmate', gameState);
          return;
        }

        if (gameState.chess.isStalemate()) {
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: gameState.chess.fen(), inCheck: false, captured: move.captured || null });
          await contest.save();
          await endContest(contestId, null, null, 'stalemate', gameState);
          return;
        }

        if (gameState.chess.isThreefoldRepetition()) {
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: gameState.chess.fen(), inCheck: false, captured: move.captured || null });
          await contest.save();
          await endContest(contestId, null, null, 'repetition', gameState);
          return;
        }

        if (gameState.chess.isInsufficientMaterial()) {
          io.to(contestId).emit('moveMade', { contestId, from, to, san: move.san, fen: gameState.chess.fen(), inCheck: false, captured: move.captured || null });
          await contest.save();
          await endContest(contestId, null, null, 'insufficient', gameState);
          return;
        }

        await contest.save();

        // BUG 6 FIX: Start timer only after the first move (White's first move)
        // After White's first move, moveCount becomes 1, and we start the timer
        // This means both players get equal time starting from the first move
        startMoveTimer(contestId, gameState);

        io.to(contestId).emit('moveMade', {
          contestId, from, to, san: move.san,
          fen: gameState.chess.fen(),
          inCheck: gameState.chess.isCheck(),
          captured: move.captured || null,
        });
      } catch (err) {
        console.error('[makeMove] error:', err);
      }
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
      const gameState = games.get(contestId);
      if (!gameState) return;
      pendingDrawOffers.set(contestId, playerId);
      const opponentId = gameState.players.find(p => p !== playerId);
      if (opponentId) {
        const opSid = userSockets.get(opponentId);
        if (opSid) io.to(opSid).emit('drawOffer', { contestId, fromPlayerId: playerId });
      }
    });

    socket.on('drawResponse', async ({ contestId, playerId, accepted }) => {
      if (!accepted) {
        pendingDrawOffers.delete(contestId);
        const gameState = games.get(contestId);
        if (gameState) {
          const offererId = gameState.players.find(p => p !== playerId);
          if (offererId) {
            const s = userSockets.get(offererId);
            if (s) io.to(s).emit('drawDeclined', { contestId });
          }
        }
        return;
      }
      await endContest(contestId, null, null, 'draw', games.get(contestId));
    });

    socket.on('emojiReaction', ({ contestId, emoji, playerId }) => { io.to(contestId).emit('emojiReaction', { emoji, playerId }); });
    
    socket.on('matchChat', ({ contestId, message, username }) => { 
      io.to(contestId).emit('matchChat', { message, username, ts: Date.now() }); 
    });

    socket.on('lobbyChat', ({ message, username }) => { 
      io.emit('lobbyChat', { message, username, ts: Date.now() }); 
    });

    socket.on('getReview', async ({ contestId }) => {
      try {
        const contest = await Contest.findById(contestId);
        if (!contest) return;
        if (contest.review) {
          socket.emit('reviewData', { contestId, review: contest.review });
        } else {
          const sanMoves = (contest.moves || []).map(m => m.san).filter(Boolean);
          if (sanMoves.length > 0) {
            const reviewData = analyzeGame(sanMoves);
            contest.review = reviewData;
            await contest.save();
            socket.emit('reviewData', { contestId, review: reviewData });
          }
        }
      } catch (err) {}
    });

    socket.on('disconnect', async () => {
      let disconnectedUserId = null;
      for (const [uid, sid] of userSockets.entries()) {
        if (sid === socket.id) { disconnectedUserId = uid; userSockets.delete(uid); break; }
      }
      if (disconnectedUserId) {
        // Refund from any open contests the player was waiting in
        try {
          const openContests = await Contest.find({
            players: disconnectedUserId,
            status: 'open',
          }).populate('contestType');

          for (const contest of openContests) {
            contest.players = contest.players.filter(p => p.toString() !== disconnectedUserId);
            await contest.save();
            const ct = contest.contestType;
            if (ct && ct.entry > 0) {
              await User.findByIdAndUpdate(disconnectedUserId, { $inc: { wallet: ct.entry } });
              await Transaction.create({
                userId: disconnectedUserId,
                amount: ct.entry,
                type: 'credit',
                reason: `Refund — disconnected from ${ct.name}`,
                status: 'completed',
              });
            }
            io.emit('contestUpdated', { contestId: contest._id.toString(), players: contest.players.length });
          }
        } catch (e) {
          console.error('[disconnect] refund error:', e);
        }

        // Handle active games — opponent wins after 15s if player doesn't reconnect
        for (const [contestId, gameState] of games) {
          if (gameState.players.includes(disconnectedUserId)) {
            const contest = await Contest.findById(contestId);
            if (contest && contest.status === 'playing') {
              const winnerId = gameState.players.find(p => p !== disconnectedUserId);
              setTimeout(async () => {
                if (!userSockets.has(disconnectedUserId)) await endContest(contestId, winnerId, disconnectedUserId, 'disconnect', gameState);
              }, 15000);
            }
          }
        }
      }
    });

  });
};
