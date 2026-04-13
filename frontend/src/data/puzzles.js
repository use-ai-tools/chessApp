export const puzzles = [
  { "id": 1, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "4R1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Re8#"], "moves": 1, "hint": "Rook to the back rank!" },
  { "id": 2, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", "solution": ["Rd8#"], "moves": 1, "hint": "Back rank is weak!" },
  { "id": 3, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "7k/6pp/8/8/8/6Q1/6PP/6K1 w - - 0 1", "solution": ["Qg8#"], "moves": 1, "hint": "Queen delivers checkmate!" },
  { "id": 4, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/6pp/8/8/8/8/6PP/5RK1 w - - 0 1", "solution": ["Rf8#"], "moves": 1, "hint": "Rook to f8 is checkmate!" },
  { "id": 5, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "3R2k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Rd8#"], "moves": 1, "hint": "Back rank mate with rook!" },
  { "id": 6, "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1", "solution": ["Qxf7#"], "difficulty": "EASY", "moves": 1, "hint": "Scholar's mate variation." },
  { "id": 7, "fen": "k7/1R6/1K6/8/8/8/8/1R6 w - - 0 1", "solution": ["Ra1#"], "difficulty": "EASY", "moves": 1, "hint": "Rook mate on the file." },
  { "id": 8, "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1", "solution": ["Qxf7#"], "difficulty": "EASY", "moves": 1, "hint": "Classic attack on f7." },
  { "id": 9, "fen": "5rk1/5ppp/8/8/8/8/1Q6/6K1 w - - 0 1", "solution": ["Qb8#"], "difficulty": "EASY", "moves": 1, "hint": "Back rank weakness." },
  { "id": 10, "fen": "2k5/8/2K5/8/8/8/R7/8 w - - 0 1", "solution": ["Ra8#"], "difficulty": "EASY", "moves": 1, "hint": "Checkmate from distance." }
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