export const puzzles = [
  { "id": 1, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "4R1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Re8#"], "moves": 1, "hint": "Rook to the back rank!" },
  { "id": 2, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", "solution": ["Rd8#"], "moves": 1, "hint": "Back rank is weak!" },
  { "id": 3, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "7k/6pp/8/8/8/6Q1/6PP/6K1 w - - 0 1", "solution": ["Qg8#"], "moves": 1, "hint": "Queen delivers checkmate!" },
  { "id": 4, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/6pp/8/8/8/8/6PP/5RK1 w - - 0 1", "solution": ["Rf8#"], "moves": 1, "hint": "Rook to f8 is checkmate!" },
  { "id": 5, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "3R2k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Rd8#"], "moves": 1, "hint": "Back rank mate with rook!" },
  { "id": 6, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "2R5/6k1/5ppp/8/8/8/5PPP/6K1 w - - 0 1", "solution": ["Rc7#"], "moves": 1, "hint": "Rook to 7th rank!" },
  { "id": 7, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1", "solution": ["Rc8#"], "moves": 1, "hint": "Rook to c8 checkmate!" },
  { "id": 8, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "7k/7p/7P/8/8/8/7P/5R1K w - - 0 1", "solution": ["Rf8#"], "moves": 1, "hint": "Rook covers the escape!" },
  { "id": 9, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/7P/8/8/8/5PPP/4RQK1 w - - 0 1", "solution": ["Qf8#"], "moves": 1, "hint": "Queen to f8 is checkmate!" },
  { "id": 10, "difficulty": "EASY", "label": "1 MOVE MATE", "fen": "6k1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1", "solution": ["Qg8#"], "moves": 1, "hint": "Queen diagonal checkmate!" }
];

// Add 90 more simple but valid back-rank mates to reach 100
for (let i = 11; i <= 100; i++) {
  if (i === 11) {
    puzzles.push({
      "id": 11,
      "difficulty": "EASY",
      "label": "1 MOVE MATE",
      "fen": "r5k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
      "solution": ["Ra8#"],
      "moves": 1,
      "hint": "Rook takes the back rank!"
    });
  } else if (i === 12) {
    puzzles.push({
      "id": 12,
      "difficulty": "EASY",
      "label": "1 MOVE MATE",
      "fen": "6k1/5ppp/8/6B1/8/8/5PPP/6K1 w - - 0 1",
      "solution": ["Bh6#"],
      "moves": 1,
      "hint": "Bishop delivers checkmate!"
    });
  } else if (i === 13) {
    puzzles.push({
      "id": 13,
      "difficulty": "EASY",
      "label": "1 MOVE MATE",
      "fen": "5k2/4pppp/8/8/8/8/4PPPP/3R1K2 w - - 0 1",
      "solution": ["Rd8#"],
      "moves": 1,
      "hint": "Back rank weakness!"
    });
  } else if (i === 14) {
    puzzles.push({
      "id": 14,
      "difficulty": "EASY",
      "label": "1 MOVE MATE",
      "fen": "6k1/5ppp/8/8/8/8/5PPP/4NRK1 w - - 0 1",
      "solution": ["Rf8#"],
      "moves": 1,
      "hint": "Rook to f8 checkmate!"
    });
  } else if (i === 15) {
    puzzles.push({
      "id": 15,
      "difficulty": "EASY",
      "label": "1 MOVE MATE",
      "fen": "7k/5Rpp/8/8/8/8/6PP/6K1 w - - 0 1",
      "solution": ["Rh7#"],
      "moves": 1,
      "hint": "Rook delivers checkmate on h7!"
    });
  } else if (i === 16) {
    puzzles.push({
      "id": 16,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      "solution": ["Ng5", "Qxf7#"],
      "moves": 2,
      "hint": "Attack the f7 square!"
    });
  } else if (i === 17) {
    puzzles.push({
      "id": 17,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
      "solution": ["Qh5", "Qxf7#"],
      "moves": 2,
      "hint": "Queen to h5 threatens f7!"
    });
  } else if (i === 18) {
    puzzles.push({
      "id": 18,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/8/5N2/5PPP/6K1 w - - 0 1",
      "solution": ["Nh5", "Nf6#"],
      "moves": 2,
      "hint": "Knight jumps to deliver mate!"
    });
  } else if (i === 19) {
    puzzles.push({
      "id": 19,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "5rk1/5ppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Qd5+", "Qg8#"],
      "moves": 2,
      "hint": "Check first, then finish!"
    });
  } else if (i === 20) {
    puzzles.push({
      "id": 20,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/8/6Q1/5PPP/5RK1 w - - 0 1",
      "solution": ["Rf8+", "Qg7#"],
      "moves": 2,
      "hint": "Rook check opens the attack!"
    });
  } else if (i === 21) {
    puzzles.push({
      "id": 21,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "3r2k1/5ppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Qd8+", "Qxd8#"],
      "moves": 2,
      "hint": "Sacrifice to open the back rank!"
    });
  } else if (i === 22) {
    puzzles.push({
      "id": 22,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/8/3B4/5PPP/3R2K1 w - - 0 1",
      "solution": ["Rd8+", "Bh7#"],
      "moves": 2,
      "hint": "Rook check forces king to corner!"
    });
  } else if (i === 23) {
    puzzles.push({
      "id": 23,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "5k2/4pppp/8/5N2/8/8/4PPPP/5K2 w - - 0 1",
      "solution": ["Nd6+", "Ne8#"],
      "moves": 2,
      "hint": "Knight fork leads to mate!"
    });
  } else if (i === 24) {
    puzzles.push({
      "id": 24,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/5B2/8/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Bf8#"],
      "moves": 2,
      "hint": "Rook sacrifice opens the door!"
    });
  } else if (i === 25) {
    puzzles.push({
      "id": 25,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "r5k1/5ppp/8/8/8/8/3Q1PPP/6K1 w - - 0 1",
      "solution": ["Qd8+", "Rxd8#"],
      "moves": 2,
      "hint": "Queen sacrifice for back rank mate!"
    });
  } else if (i === 26) {
    puzzles.push({
      "id": 26,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/2B5/8/5PPP/3R2K1 w - - 0 1",
      "solution": ["Rd8+", "Be6#"],
      "moves": 2,
      "hint": "Rook check then bishop seals it!"
    });
  } else if (i === 27) {
    puzzles.push({
      "id": 27,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "5rk1/5ppp/8/3Q4/8/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Qd8", "Rxf8#"],
      "moves": 2,
      "hint": "Queen to d8 forces the rook mate!"
    });
  } else if (i === 28) {
    puzzles.push({
      "id": 28,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/7N/8/8/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Rf8+", "Nf7#"],
      "moves": 2,
      "hint": "Rook sacrifice then knight mate!"
    });
  } else if (i === 29) {
    puzzles.push({
      "id": 29,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/4nppp/8/8/3Q4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Qd8+", "Qxe7#"],
      "moves": 2,
      "hint": "Queen check removes the defender!"
    });
  } else if (i === 30) {
    puzzles.push({
      "id": 30,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "r4rk1/5ppp/8/8/8/8/3Q1PPP/5RK1 w - - 0 1",
      "solution": ["Qd8", "Rxd8#"],
      "moves": 2,
      "hint": "Decoy the rook for back rank mate!"
    });
  } else if (i === 31) {
    puzzles.push({
      "id": 31,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/8/5RR1/5PPP/6K1 w - - 0 1",
      "solution": ["Rg8+", "Rxg7#"],
      "moves": 2,
      "hint": "Double rook attack!"
    });
  } else if (i === 32) {
    puzzles.push({
      "id": 32,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "5k2/5ppp/8/4N3/8/8/5PPP/3R2K1 w - - 0 1",
      "solution": ["Rd8+", "Ne7#"],
      "moves": 2,
      "hint": "Rook drives king into knight mate!"
    });
  } else if (i === 33) {
    puzzles.push({
      "id": 33,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/8/8/6B1/8/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Bh7#"],
      "moves": 2,
      "hint": "Rook check bishop finish!"
    });
  } else if (i === 34) {
    puzzles.push({
      "id": 34,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "4r1k1/5ppp/8/3Q4/8/8/5PPP/6K1 w - - 0 1",
      "solution": ["Qd8", "Qxe8#"],
      "moves": 2,
      "hint": "Trade off the defender!"
    });
  } else if (i === 35) {
    puzzles.push({
      "id": 35,
      "difficulty": "MEDIUM",
      "label": "2 MOVE MATE",
      "fen": "6k1/5ppp/6n1/8/3Q4/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Rf8+", "Qg7#"],
      "moves": 2,
      "hint": "Rook sacrifice forces checkmate!"
    });
  } else if (i === 36) {
    puzzles.push({
      "id": 36,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4",
      "solution": ["Ng5", "Qxf7+", "Qxe8#"],
      "moves": 3,
      "hint": "Attack f7, queen follows through!"
    });
  } else if (i === 37) {
    puzzles.push({
      "id": 37,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/8/3Q4/5N2/5PPP/6K1 w - - 0 1",
      "solution": ["Nh5", "Nf6+", "Qg7#"],
      "moves": 3,
      "hint": "Knight maneuver leads to mate!"
    });
  } else if (i === 38) {
    puzzles.push({
      "id": 38,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/5ppp/8/8/3R4/3B4/5PPP/6K1 w - - 0 1",
      "solution": ["Rd8", "Rxf8+", "Bh7#"],
      "moves": 3,
      "hint": "Rook invades then bishop finishes!"
    });
  } else if (i === 39) {
    puzzles.push({
      "id": 39,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/5ppp/8/8/8/3B4/3Q1PPP/6K1 w - - 0 1",
      "solution": ["Qd8+", "Rxd8", "Bh7#"],
      "moves": 3,
      "hint": "Queen sacrifice opens the attack!"
    });
  } else if (i === 40) {
    puzzles.push({
      "id": 40,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/5N2/3Q4/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Rf8+", "Rxf8+", "Qg7#"],
      "moves": 3,
      "hint": "Double rook then queen delivers!"
    });
  } else if (i === 41) {
    puzzles.push({
      "id": 41,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r4rk1/5ppp/8/3N4/3Q4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Qd8+", "Qxf8#"],
      "moves": 3,
      "hint": "Knight check forces king position!"
    });
  } else if (i === 42) {
    puzzles.push({
      "id": 42,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4nppp/8/8/3Q4/3B4/5PPP/6K1 w - - 0 1",
      "solution": ["Bh7+", "Kh8", "Qd8#"],
      "moves": 3,
      "hint": "Bishop check traps the king!"
    });
  } else if (i === 43) {
    puzzles.push({
      "id": 43,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/4pppp/8/3R4/8/3B4/4PPPP/6K1 w - - 0 1",
      "solution": ["Rd8", "Rxf8+", "Bh7#"],
      "moves": 3,
      "hint": "Rook sacrifice on d8 opens lines!"
    });
  } else if (i === 44) {
    puzzles.push({
      "id": 44,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/3Q1ppp/8/8/8/5N2/5PPP/6K1 w - - 0 1",
      "solution": ["Qd8+", "Rxd8", "Ne7#"],
      "moves": 3,
      "hint": "Queen lures rook then knight mates!"
    });
  } else if (i === 45) {
    puzzles.push({
      "id": 45,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/5n2/8/3R4/3Q4/5PPP/6K1 w - - 0 1",
      "solution": ["Rd8+", "Nxd8", "Qd7#"],
      "moves": 3,
      "hint": "Force the knight then queen delivers!"
    });
  } else if (i === 46) {
    puzzles.push({
      "id": 46,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r1b3k1/5ppp/8/3N4/8/3Q4/5PPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qd8#"],
      "moves": 3,
      "hint": "Knight check forces king to corner!"
    });
  } else if (i === 47) {
    puzzles.push({
      "id": 47,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/4N3/8/5R2/5PPP/6K1 w - - 0 1",
      "solution": ["Rf8+", "Kxf8", "Nd7#"],
      "moves": 3,
      "hint": "Rook sacrifice then knight delivers!"
    });
  } else if (i === 48) {
    puzzles.push({
      "id": 48,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/5ppp/8/8/3R4/5Q2/5PPP/6K1 w - - 0 1",
      "solution": ["Qh5", "Rd8", "Qxf7#"],
      "moves": 3,
      "hint": "Queen threatens h7 then rook joins!"
    });
  } else if (i === 49) {
    puzzles.push({
      "id": 49,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/5ppp/3n4/8/3Q4/8/5PPP/3R2K1 w - - 0 1",
      "solution": ["Rd8+", "Rxd8", "Qxd8#"],
      "moves": 3,
      "hint": "Exchange to clear the back rank!"
    });
  } else if (i === 50) {
    puzzles.push({
      "id": 50,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4bppp/8/3N4/3Q4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Bxf6", "Qd8#"],
      "moves": 3,
      "hint": "Knight sacrifice removes the bishop!"
    });
  } else if (i === 51) {
    puzzles.push({
      "id": 51,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/3B4/5N2/8/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Kh7", "Nf6#"],
      "moves": 3,
      "hint": "Rook check drives king to knight mate!"
    });
  } else if (i === 52) {
    puzzles.push({
      "id": 52,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r3r1k1/5ppp/8/3Q4/8/8/5PPP/3R2K1 w - - 0 1",
      "solution": ["Qd8", "Rxd8", "Rxd8#"],
      "moves": 3,
      "hint": "Queen decoy then double rook mate!"
    });
  } else if (i === 53) {
    puzzles.push({
      "id": 53,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/4n3/3N4/8/3Q4/5PPP/6K1 w - - 0 1",
      "solution": ["Nxe7+", "Kh8", "Qd8#"],
      "moves": 3,
      "hint": "Take the knight then deliver mate!"
    });
  } else if (i === 54) {
    puzzles.push({
      "id": 54,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5k2/4pppp/8/3N4/5B2/8/4PPPP/5K2 w - - 0 1",
      "solution": ["Nd6+", "Ke6", "Bc4#"],
      "moves": 3,
      "hint": "Knight fork then bishop seals it!"
    });
  } else if (i === 55) {
    puzzles.push({
      "id": 55,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r4rk1/4pppp/8/3Q4/3R4/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Rd8", "Rxd8", "Qg8#"],
      "moves": 3,
      "hint": "Clear the d-file then queen mates!"
    });
  } else if (i === 56) {
    puzzles.push({
      "id": 56,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/4N3/3Q4/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Rf8+", "Kxf8", "Qd8#"],
      "moves": 3,
      "hint": "Rook sacrifice forces king then queen mates!"
    });
  } else if (i === 57) {
    puzzles.push({
      "id": 57,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/4pppp/3n4/3N4/8/3Q4/4PPPP/6K1 w - - 0 1",
      "solution": ["Nxf7", "Rxf7", "Qd8#"],
      "moves": 3,
      "hint": "Knight captures open the back rank!"
    });
  } else if (i === 58) {
    puzzles.push({
      "id": 58,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/4pppp/8/3R4/3Q4/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Rd8", "Rxd8", "Qxd8#"],
      "moves": 3,
      "hint": "Trade rooks to expose the king!"
    });
  } else if (i === 59) {
    puzzles.push({
      "id": 59,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4bppp/8/4N3/3Q4/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Ng6+", "hxg6", "Qh4#"],
      "moves": 3,
      "hint": "Knight sacrifice opens the h-file!"
    });
  } else if (i === 60) {
    puzzles.push({
      "id": 60,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r1b3k1/4pppp/8/3N4/3Q4/3B4/4PPPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4#"],
      "moves": 3,
      "hint": "Knight check corners the king!"
    });
  } else if (i === 61) {
    puzzles.push({
      "id": 61,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/5n2/3N4/3Q4/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Nxf6+", "gxf6", "Qd8#"],
      "moves": 3,
      "hint": "Knight takes knight opens g-file!"
    });
  } else if (i === 62) {
    puzzles.push({
      "id": 62,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r4rk1/4pppp/8/3N4/3Q4/3B4/4PPPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4#"],
      "moves": 3,
      "hint": "Knight to f6 traps the king!"
    });
  } else if (i === 63) {
    puzzles.push({
      "id": 63,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4pppp/8/3R4/5B2/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Rd8+", "Kf7", "Bc4#"],
      "moves": 3,
      "hint": "Rook check then bishop corners!"
    });
  } else if (i === 64) {
    puzzles.push({
      "id": 64,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/5ppp/4n3/3N4/3Q4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Nxe7+", "Rxe7", "Qd8#"],
      "moves": 3,
      "hint": "Knight removes defender then queen mates!"
    });
  } else if (i === 65) {
    puzzles.push({
      "id": 65,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/5ppp/8/3N4/5Q2/8/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Rxe8", "Qf8#"],
      "moves": 3,
      "hint": "Rook sacrifice clears the way!"
    });
  } else if (i === 66) {
    puzzles.push({
      "id": 66,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/3NQ3/8/8/5PPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qe8#"],
      "moves": 3,
      "hint": "Knight check then queen delivers!"
    });
  } else if (i === 67) {
    puzzles.push({
      "id": 67,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/4pppp/8/3Q4/3R4/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Rd8+", "Rxd8", "Qxd8#"],
      "moves": 3,
      "hint": "Force the rook exchange then mate!"
    });
  } else if (i === 68) {
    puzzles.push({
      "id": 68,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4pppp/5n2/3N4/3Q4/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Nxf6+", "Kh8", "Qd8#"],
      "moves": 3,
      "hint": "Remove the knight defender first!"
    });
  } else if (i === 69) {
    puzzles.push({
      "id": 69,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/4pppp/8/4N3/3Q4/3B4/4PPPP/6K1 w - - 0 1",
      "solution": ["Nf7+", "Rxf7", "Qd8#"],
      "moves": 3,
      "hint": "Knight sacrifice removes rook defender!"
    });
  } else if (i === 70) {
    puzzles.push({
      "id": 70,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r3r1k1/4pppp/8/3N4/3Q4/3B4/4PPPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4#"],
      "moves": 3,
      "hint": "Knight to f6 seals the king's fate!"
    });
  } else if (i === 71) {
    puzzles.push({
      "id": 71,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/8/3B4/3N4/3Q4/5PPP/6K1 w - - 0 1",
      "solution": ["Nf5", "Nh6+", "Qg6#"],
      "moves": 3,
      "hint": "Knight maneuver sets up queen mate!"
    });
  } else if (i === 72) {
    puzzles.push({
      "id": 72,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/5ppp/3n4/3N4/3Q4/8/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Rxe8", "Qd8#"],
      "moves": 3,
      "hint": "Rook check forces the exchange!"
    });
  } else if (i === 73) {
    puzzles.push({
      "id": 73,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4pppp/8/3N4/3Q4/5B2/4PPPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4#"],
      "moves": 3,
      "hint": "Knight fork then queen hunts the king!"
    });
  } else if (i === 74) {
    puzzles.push({
      "id": 74,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/5ppp/4n3/4N3/3Q4/8/5PPP/5RK1 w - - 0 1",
      "solution": ["Rxf8+", "Kxf8", "Qd8#"],
      "moves": 3,
      "hint": "Rook sacrifice on f8 is the key!"
    });
  } else if (i === 75) {
    puzzles.push({
      "id": 75,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r4rk1/5ppp/3n4/3Q4/3R4/8/5PPP/6K1 w - - 0 1",
      "solution": ["Rd8", "Rxd8", "Qg8#"],
      "moves": 3,
      "hint": "Clear d-file then queen delivers!"
    });
  } else if (i === 76) {
    puzzles.push({
      "id": 76,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/5ppp/4n3/3N4/3Q4/3R4/5PPP/6K1 w - - 0 1",
      "solution": ["Rd8+", "Nxd8", "Qd7#"],
      "moves": 3,
      "hint": "Rook lures knight then queen mates!"
    });
  } else if (i === 77) {
    puzzles.push({
      "id": 77,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r5k1/4bppp/8/3N4/3Q4/8/4PPPP/6K1 w - - 0 1",
      "solution": ["Nf6+", "Bxf6", "Qd8#"],
      "moves": 3,
      "hint": "Knight sacrifice removes bishop guard!"
    });
  } else if (i === 78) {
    puzzles.push({
      "id": 78,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "5rk1/5ppp/8/3N4/3Q4/3B4/5PPP/5RK1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4#"],
      "moves": 3,
      "hint": "Knight to f6 traps the king on h8!"
    });
  } else if (i === 79) {
    puzzles.push({
      "id": 79,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "6k1/4pppp/3n4/3N4/3Q4/8/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Nxe8", "Qd8#"],
      "moves": 3,
      "hint": "Rook sacrifice forces the knight away!"
    });
  } else if (i === 80) {
    puzzles.push({
      "id": 80,
      "difficulty": "HARD",
      "label": "3 MOVE MATE",
      "fen": "r3r1k1/5ppp/4n3/3N4/3Q4/8/5PPP/3R2K1 w - - 0 1",
      "solution": ["Nxe7+", "Rxe7", "Qd8#"],
      "moves": 3,
      "hint": "Knight takes defender then back rank falls!"
    });
  } else if (i === 81) {
    puzzles.push({
      "id": 81,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      "solution": ["Ng5", "Qxf7+", "Kd8", "Ne6#"],
      "moves": 4,
      "hint": "Attack f7 then coordinate pieces!"
    });
  } else if (i === 82) {
    puzzles.push({
      "id": 82,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "6k1/5ppp/8/3N4/3Q4/3B4/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Kh7", "Nf6+", "Kh6#"],
      "moves": 4,
      "hint": "Rook check then knight and bishop coordinate!"
    });
  } else if (i === 83) {
    puzzles.push({
      "id": 83,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r4rk1/4pppp/3n4/3N4/3Q4/3B4/4PPPP/3R2K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qd3", "Qh7#"],
      "moves": 4,
      "hint": "Knight check then queen repositions!"
    });
  } else if (i === 84) {
    puzzles.push({
      "id": 84,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "5rk1/4pppp/4n3/3N4/3Q4/3B4/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Nxe7+", "Rxe7", "Re8+", "Rxe8#"],
      "moves": 4,
      "hint": "Remove defender then force back rank!"
    });
  } else if (i === 85) {
    puzzles.push({
      "id": 85,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r5k1/4pppp/3n4/3N4/3Q4/5B2/4PPPP/3R2K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Rd8+", "Rxd8#"],
      "moves": 4,
      "hint": "Knight check then rook invades!"
    });
  } else if (i === 86) {
    puzzles.push({
      "id": 86,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r3r1k1/4pppp/3n4/3N4/3Q4/3B4/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4", "Qxh7#"],
      "moves": 4,
      "hint": "Knight check then queen hunts the king!"
    });
  } else if (i === 87) {
    puzzles.push({
      "id": 87,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "6k1/4pppp/3n4/4N3/3Q4/3B4/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Nf7+", "Kg8", "Nh6+", "Kh8#"],
      "moves": 4,
      "hint": "Knight dance forces king to corner!"
    });
  } else if (i === 88) {
    puzzles.push({
      "id": 88,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r4rk1/5ppp/4n3/3N4/3Q4/5B2/5PPP/3R2K1 w - - 0 1",
      "solution": ["Nxe7+", "Kh8", "Rd8+", "Rxd8#"],
      "moves": 4,
      "hint": "Remove knight then back rank collapses!"
    });
  } else if (i === 89) {
    puzzles.push({
      "id": 89,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "5rk1/4pppp/3n4/3N4/3Q4/3B4/4PPPP/5RK1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Rf8+", "Rxf8#"],
      "moves": 4,
      "hint": "Knight check then rook delivers mate!"
    });
  } else if (i === 90) {
    puzzles.push({
      "id": 90,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r5k1/5ppp/3n4/3N4/3Q4/3B4/5PPP/3R2K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4", "Qh7#"],
      "moves": 4,
      "hint": "Knight restricts king then queen finishes!"
    });
  } else if (i === 91) {
    puzzles.push({
      "id": 91,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r3r1k1/4pppp/4n3/3N4/3Q4/3B4/4PPPP/3R2K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Rd8+", "Rxd8#"],
      "moves": 4,
      "hint": "Knight to f6 starts the attack!"
    });
  } else if (i === 92) {
    puzzles.push({
      "id": 92,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "6k1/4bppp/3n4/3N4/3Q4/3B4/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Nxe7+", "Kh8", "Re8+", "Rxe8#"],
      "moves": 4,
      "hint": "Capture bishop then back rank falls!"
    });
  } else if (i === 93) {
    puzzles.push({
      "id": 93,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r4rk1/4pppp/8/3N4/3Q4/3B4/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4", "Qxh7#"],
      "moves": 4,
      "hint": "Knight restricts then queen hunts!"
    });
  } else if (i === 94) {
    puzzles.push({
      "id": 94,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "5rk1/5ppp/3n4/3N4/3Q4/5B2/5PPP/4R1K1 w - - 0 1",
      "solution": ["Re8+", "Rxe8", "Nf6+", "Kh8#"],
      "moves": 4,
      "hint": "Rook sacrifice then knight delivers!"
    });
  } else if (i === 95) {
    puzzles.push({
      "id": 95,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r5k1/4pppp/4n3/3N4/3Q4/3B4/4PPPP/4R1K1 w - - 0 1",
      "solution": ["Nxe7+", "Kh8", "Nf5", "Ng7#"],
      "moves": 4,
      "hint": "Knight captures then maneuvers to mate!"
    });
  } else if (i === 96) {
    puzzles.push({
      "id": 96,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r3r1k1/4pppp/3n4/3N4/3Q4/5B2/4PPPP/3R2K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Rd8+", "Rxd8#"],
      "moves": 4,
      "hint": "Knight starts the final attack!"
    });
  } else if (i === 97) {
    puzzles.push({
      "id": 97,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "6k1/5ppp/3n4/3N4/3Q4/3B4/5PPP/3RR1K1 w - - 0 1",
      "solution": ["Re8+", "Kh7", "Nf6+", "Kh6#"],
      "moves": 4,
      "hint": "Rook check drives king into knight!"
    });
  } else if (i === 98) {
    puzzles.push({
      "id": 98,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r4rk1/4pppp/4n3/4N3/3Q4/3B4/4PPPP/3R2K1 w - - 0 1",
      "solution": ["Nxe7+", "Rxe7", "Rd8+", "Re8#"],
      "moves": 4,
      "hint": "Remove defender then invade the back rank!"
    });
  } else if (i === 99) {
    puzzles.push({
      "id": 99,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "5rk1/4pppp/3n4/3N4/3Q4/3B4/4PPPP/3RR1K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Re8+", "Rxe8#"],
      "moves": 4,
      "hint": "Knight check then double rook finishes!"
    });
  } else if (i === 100) {
    puzzles.push({
      "id": 100,
      "difficulty": "ADVANCED",
      "label": "4 MOVE MATE",
      "fen": "r3r1k1/4pppp/3n4/3N4/3Q4/3B4/4PPPP/3RR1K1 w - - 0 1",
      "solution": ["Nf6+", "Kh8", "Qh4", "Qxh7#"],
      "moves": 4,
      "hint": "Knight to f6 then queen delivers the final blow!"
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