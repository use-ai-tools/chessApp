const fs = require('fs');

async function fetchPuzzles() {
  const puzzles = [];
  const seenFens = new Set();
  
  // Categorize
  let eCount = 0; // 1-10
  let mCount = 0; // 11-35
  let hCount = 0; // 36-60
  let aCount = 0; // 61-85
  let maCount = 0; // 86-100
  
  let i = 1;
  while(i <= 100) {
    try {
      const res = await fetch('https://api.chess.com/pub/puzzle/random');
      const data = await res.json();
      const pgn = data.pgn;
      
      const fenMatch = pgn.match(/\[FEN "([^"]+)"\]/);
      if (!fenMatch) continue;
      const fen = fenMatch[1];
      
      if (seenFens.has(fen)) continue;
      
      // parse moves
      const movesText = pgn.split('\n\n').pop().trim().replace(/\{[^}]+\}/g, '').replace(/\[[^\]]+\]/g, '');
      const rawTokens = movesText.split(/\s+/).filter(t => !t.includes('.') && t !== '*');
      const solution = rawTokens; // Usually standard SAN in PGN
      
      if (solution.length === 0) continue;
      
      const movesCount = Math.ceil(solution.length / 2);
      
      let diff = 'easy';
      // Mates logic based on length
      if (movesCount === 1) {
          if (eCount >= 10) continue; // Already have enough easy
          diff = 'easy';
          eCount++;
      } else if (movesCount === 2) {
          if (mCount >= 25) continue;
          diff = 'medium';
          mCount++;
      } else if (movesCount === 3) {
          if (hCount >= 25) continue;
          diff = 'hard';
          hCount++;
      } else if (movesCount === 4) {
          if (aCount >= 25) continue;
          diff = 'advanced';
          aCount++;
      } else {
          if (maCount >= 15) continue;
          diff = 'master';
          maCount++;
      }
      
      seenFens.add(fen);
      puzzles.push({
        id: i,
        fen,
        solution,
        difficulty: diff,
        moves: movesCount,
        hint: `Look ahead ${movesCount} moves.`
      });
      console.log(`Fetched puzzle ${i}/100 [${diff}]`);
      i++;
      
      // Add slight delay to not upset the API
      await new Promise(r => setTimeout(r, 100));
      
    } catch(e) {
      console.error(e.message);
    }
  }
  
  const content = `// Auto-generated 100 Real Chess Puzzles
export const puzzles = ${JSON.stringify(puzzles, null, 2)};
`;
  
  fs.writeFileSync('../frontend/src/data/puzzles.js', content, 'utf8');
  console.log('Successfully wrote frontend/src/data/puzzles.js!');
}

fetchPuzzles();
