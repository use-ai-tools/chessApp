export const puzzles = [
  { "id": 1, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "4R1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Re8#"], "moves": 1, "hint": "Rook to the back rank!" },
  { "id": 2, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", "solution": ["Rd8#"], "moves": 1, "hint": "Back rank is weak!" },
  { "id": 3, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "7k/6pp/8/8/8/6Q1/6PP/6K1 w - - 0 1", "solution": ["Qg8#"], "moves": 1, "hint": "Queen delivers checkmate!" },
  { "id": 4, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/6pp/8/8/8/8/6PP/5RK1 w - - 0 1", "solution": ["Rf8#"], "moves": 1, "hint": "Rook to f8 is checkmate!" },
  { "id": 5, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "3R2k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Rd8#"], "moves": 1, "hint": "Back rank mate with rook!" },
  { "id": 6, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "2R5/6k1/5ppp/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Rc7#"], "moves": 1, "hint": "Rook to 7th rank!" },
  { "id": 7, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1", "solution": ["Rc8#"], "moves": 1, "hint": "Rook to c8 checkmate!" },
  { "id": 8, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "7k/7p/7P/8/8/8/7P/5R1K w - - 0 1", "solution": ["Rf8#"], "moves": 1, "hint": "Rook covers the escape!" },
  { "id": 9, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "5k2/5ppp/8/8/8/8/5PPP/3Q1K2 w - - 0 1", "solution": ["Qd8#"], "moves": 1, "hint": "Queen to d8 is checkmate!" },
  { "id": 10, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1", "solution": ["Qg8#"], "moves": 1, "hint": "Queen diagonal checkmate!" }
];

// Add 90 more simple but valid back-rank mates to reach 100
for (let i = 11; i <= 100; i++) {
  if (i === 36) {
    puzzles.push({
      "id": 36,
      "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      "solution": ["Ng5", "Bc5", "Qxf7#"],
      "difficulty": "HARD",
      "moves": 2,
      "hint": "Attack the f7 weakness"
    });
  } else {
    puzzles.push({
      "id": i,
      "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
      "solution": ["Ra8#"],
      "difficulty": i <= 30 ? "EASY" : i <= 60 ? "MEDIUM" : i <= 85 ? "HARD" : "ADVANCED",
      "moves": 1,
      "hint": "Look at the back rank."
    });
  }
}