const fs = require('fs');
const { puzzles } = require('./frontend/src/data/puzzles.js');

const uniquePuzzles = [];
const seenFens = new Set();

for (const p of puzzles) {
  if (!seenFens.has(p.fen)) {
    uniquePuzzles.push(p);
    seenFens.add(p.fen);
  }
}

// Write the filtered array back to the file
const fileContent = `export const puzzles = ${JSON.stringify(uniquePuzzles, null, 2)};\n`;
fs.writeFileSync('./frontend/src/data/puzzles.js', fileContent);
console.log(`Removed ${puzzles.length - uniquePuzzles.length} duplicate puzzles! Remaining: ${uniquePuzzles.length}`);
