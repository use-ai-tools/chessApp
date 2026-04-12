const { Chess } = require('chess.js');
const fs = require('fs');

const puzzles = [];
let id = 1;

function addPuzzle(fen, solutionMoves, difficulty, hint) {
  try {
    const chess = new Chess(fen);
    const solution = [];
    for (const move of solutionMoves) {
      if (!chess.moves().includes(move) && !chess.move(move)) {
          // If the exact string isn't valid, try to catch it
          try {
             const m = chess.move(move);
             if (m) solution.push(m.san);
             else return false;
          } catch(e) { return false; }
      } else {
        const m = chess.move(move);
        solution.push(m.san);
      }
    }
    puzzles.push({
      id: id++,
      fen,
      solution,
      difficulty,
      moves: Math.ceil(solutionMoves.length / 2),
      hint
    });
    return true;
  } catch (e) {
    return false;
  }
}

// 1. Back Rank Mates (Easy, 1-move)
// White mates black on 8th rank
for (let c = 0; c < 8; c++) {
    // White rook on c7, White king on h2, Black king on g8, black pawns on f7, g7, h7
    const file = String.fromCharCode(97 + c);
    const fen = `6k1/5ppp/8/${file}R6/8/8/7K/8 w - - 0 1`;
    // wait, I need a robust FEN generator or just specific ones
}

console.log(puzzles.length);
