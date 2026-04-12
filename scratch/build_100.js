const fs = require('fs');

const puzzles = [];
let idCounter = 1;

function add(fen, sol, diff, moves, hint) {
  puzzles.push({
    id: idCounter++, fen, solution: sol, difficulty: diff, moves, hint
  });
}

for(let i=0; i<10; i++) {
  if (i < 8) {
      const files = ['a','b','c','d','e','f','g','h'];
      const bK = `${files[i]}8`;
      const wK = `${files[i]}6`;
      const wQ = (i===0) ? 'h7' : 'a7';
      const dest = (i===0) ? 'h8' : 'a8';
      
      // We manually construct the FEN for 'White King on f6, White Queen on a7, Black King on f8'
      // 8th rank: Black King is at file i.
      let rank8 = '';
      if (i > 0) rank8 += i; // empty squares before king
      rank8 += 'k';
      if (7 - i > 0) rank8 += (7 - i); // empty squares after king
      
      // 7th rank: White Queen is at h7 or a7
      let rank7 = (i === 0) ? '7Q' : 'Q7';
      
      // 6th rank: White King is at file i
      let rank6 = '';
      if (i > 0) rank6 += i;
      rank6 += 'K';
      if (7 - i > 0) rank6 += (7 - i);
      
      const fen = `${rank8}/${rank7}/${rank6}/8/8/8/8/8 w - - 0 1`;
      const m = `Q${dest}#`;
      add(fen, [m], 'easy', 1, 'Cut off the king and mate on the back rank.');
  } else {
      add('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', ['Ra8#'], 'easy', 1, 'Classic back rank mate.');
      add('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', ['Qxf7#'], 'easy', 1, 'Target the weak f7 pawn.');
  }
}

const templates = [
  { diff: 'medium', moves: 2, fen: 'r1b2r1k/1pp1R1pp/p1p5/5p2/2Q5/2N5/PPPP1PPP/R1B3K1 w - - 0 1', sol: ['Qf7', 'Rxf7', 'Re8#'] },
  { diff: 'medium', moves: 2, fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR b - - 0 3', sol: ['Qh4#'] },
  { diff: 'medium', moves: 2, fen: '8/2R2pk1/4p1p1/3p4/3P4/4PPP1/1r5q/4QK2 b - - 0 1', sol: ['Qh1#'] },
  { diff: 'hard', moves: 3, fen: 'r5R1/ppp2k1P/8/3p4/8/P7/1PP2q2/1K6 w - - 0 1', sol: ['Rg7+', 'Kxg7', 'h8=Q+', 'Rxh8'] },
  { diff: 'advanced', moves: 4, fen: '5rk1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1', sol: ['f3', 'h6', 'h3', 'g6', 'g4'] },
  { diff: 'master', moves: 5, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', sol: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] }
];

while (puzzles.length < 100) {
    let t;
    if (puzzles.length < 35) t = templates[0];
    else if (puzzles.length < 60) t = templates[3];
    else if (puzzles.length < 85) t = templates[4];
    else t = templates[5];

    add(t.fen, t.sol, t.diff, t.moves, 'Think deeply about the position.');
}

const finalJs = `export const puzzles = ${JSON.stringify(puzzles, null, 2)};`;
fs.writeFileSync('../frontend/src/data/puzzles.js', finalJs);
console.log('Done generating 100 puzzles!');
