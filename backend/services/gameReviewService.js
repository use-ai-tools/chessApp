const { Chess } = require('chess.js');

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Count material on the board from a FEN string.
 * Returns { white, black } totals.
 */
const countMaterial = (fen) => {
  const boardPart = fen.split(' ')[0];
  let white = 0, black = 0;
  for (const ch of boardPart) {
    const lower = ch.toLowerCase();
    if (PIECE_VALUES[lower] !== undefined) {
      if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) {
        white += PIECE_VALUES[lower];
      } else if (ch === ch.toLowerCase() && ch !== ch.toUpperCase()) {
        black += PIECE_VALUES[lower];
      }
    }
  }
  return { white, black };
};

/**
 * Classify a single move based on material change.
 * @param {string} fenBefore - FEN before the move
 * @param {string} san - the move in SAN
 * @param {string} fenAfter - FEN after the move
 * @param {string} playerColor - 'w' or 'b'
 * @returns {string} classification
 */
const classifyMove = (fenBefore, san, fenAfter, playerColor) => {
  const before = countMaterial(fenBefore);
  const after = countMaterial(fenAfter);

  // Material advantage from the mover's perspective
  const advBefore = playerColor === 'w'
    ? before.white - before.black
    : before.black - before.white;
  const advAfter = playerColor === 'w'
    ? after.white - after.black
    : after.black - after.white;

  const delta = advAfter - advBefore;

  // Check if it's a checkmate
  try {
    const game = new Chess(fenAfter);
    if (game.in_checkmate()) return 'brilliant';
    if (game.in_check()) {
      // Check + material gain = great move
      if (delta > 0) return 'best';
    }
  } catch (e) {}

  // Determine how many legal moves existed
  let legalMoveCount = 0;
  try {
    const gameBefore = new Chess(fenBefore);
    legalMoveCount = gameBefore.moves().length;
  } catch (e) {}

  // Sacrifice that leads to eventual advantage (only good move)
  if (delta < -2 && legalMoveCount <= 3) return 'brilliant';
  
  // Classifications based on material delta
  if (delta >= 3) return 'best';       // Won significant material
  if (delta >= 1) return 'excellent';   // Won some material
  if (delta >= 0) return 'good';        // Neutral or slightly positive
  if (delta >= -1) return 'inaccuracy'; // Lost a pawn
  if (delta >= -3) return 'mistake';    // Lost a minor piece
  return 'blunder';                      // Lost major material
};

/**
 * Analyze a complete game given a list of SAN moves.
 * Returns an array of move classifications and summary stats.
 */
const analyzeGame = (moves) => {
  if (!moves || moves.length === 0) {
    return { classifications: [], summary: getEmptySummary() };
  }

  const game = new Chess();
  const classifications = [];

  for (let i = 0; i < moves.length; i++) {
    const fenBefore = game.fen();
    const playerColor = game.turn(); // 'w' or 'b'

    try {
      const move = game.move(moves[i]);
      if (!move) {
        classifications.push({ san: moves[i], classification: 'good', index: i, color: playerColor });
        continue;
      }

      const fenAfter = game.fen();
      const classification = classifyMove(fenBefore, move.san, fenAfter, playerColor);

      classifications.push({
        san: move.san,
        classification,
        index: i,
        color: playerColor,
        from: move.from,
        to: move.to,
        captured: move.captured || null,
      });
    } catch (e) {
      classifications.push({ san: moves[i], classification: 'good', index: i, color: playerColor });
    }
  }

  // Build summary per color
  const whiteSummary = buildSummary(classifications.filter((c) => c.color === 'w'));
  const blackSummary = buildSummary(classifications.filter((c) => c.color === 'b'));

  return {
    classifications,
    white: whiteSummary,
    black: blackSummary,
    summary: buildSummary(classifications),
  };
};

const buildSummary = (moves) => {
  const s = { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  for (const m of moves) {
    if (s[m.classification] !== undefined) s[m.classification]++;
  }
  return s;
};

const getEmptySummary = () => ({
  brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0,
});

/**
 * Generate an AI coach comment based on game analysis.
 */
const generateCoachComment = (result, summary, playerColor) => {
  const myMoves = playerColor === 'w' ? result.white : result.black;
  if (!myMoves) return "Good game! Keep practicing to improve.";

  const totalMoves = Object.values(myMoves).reduce((a, b) => a + b, 0);
  if (totalMoves === 0) return "Good game!";

  const accuracy = ((myMoves.brilliant + myMoves.best + myMoves.excellent + myMoves.good) / totalMoves * 100).toFixed(0);

  if (myMoves.brilliant > 0) {
    return `Brilliant play! You found ${myMoves.brilliant} brilliant move${myMoves.brilliant > 1 ? 's' : ''}! Accuracy: ${accuracy}%`;
  }
  if (myMoves.blunder > 0 && myMoves.best > 2) {
    return `You had some great moves but ${myMoves.blunder} blunder${myMoves.blunder > 1 ? 's' : ''} cost you. Accuracy: ${accuracy}%`;
  }
  if (myMoves.blunder > 1) {
    return `Watch out for blunders! ${myMoves.blunder} blunders hurt your position. Try to slow down. Accuracy: ${accuracy}%`;
  }
  if (Number(accuracy) >= 90) {
    return `Excellent game! ${accuracy}% accuracy — near-perfect play! 🌟`;
  }
  if (Number(accuracy) >= 70) {
    return `Solid performance with ${accuracy}% accuracy. ${myMoves.best} best moves found!`;
  }
  if (myMoves.mistake > 2) {
    return `You made ${myMoves.mistake} mistakes. Review your key moments to improve. Accuracy: ${accuracy}%`;
  }
  return `Good effort with ${accuracy}% accuracy. Keep analyzing your games to improve!`;
};

module.exports = { analyzeGame, countMaterial, classifyMove, generateCoachComment };
