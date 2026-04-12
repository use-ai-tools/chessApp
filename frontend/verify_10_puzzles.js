const { Chess } = require('chess.js');

const puzzleTemplates = [
    // 1. King and Queen mate on back rank
    { fen: 'k7/8/1Q6/8/8/8/8/7K w - - 0 1', solution: ['Qb7#'], hint: 'Back rank mate with the Queen' },
    // 2. Scholar's mate variation
    { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: ['Qxf7#'], hint: 'Target the weak f7 square' },
    // 3. Back rank rook mate
    { fen: '6k1/5ppp/8/8/8/8/8/1R4K1 w - - 0 1', solution: ['Rb8#'], hint: 'Deliver mate on the eighth rank' },
    // 4. Anastasia's mate flavor
    { fen: '5rk1/5ppp/N7/8/8/8/8/6RK w - - 0 1', solution: ['Rg7#'], hint: 'Use the knight to trap the king' },
    // 5. Epaulette mate
    { fen: '4rk1r/ppp1bppp/8/8/8/8/4Q3/7K w - - 0 1', solution: ['Qxe7#'], hint: 'The king is blocked by its own rooks' },
    // 6. Suffocation mate (Knight)
    { fen: 'k7/1p6/1N6/8/8/8/8/7K w - - 0 1', solution: ['Nd7#'], hint: 'The knight jumps for the kill' }, // Wait, Nd7 isn't mate here. Let's fix.
];

// Let's refine the 10 puzzles manually with valid FENs and solutions
const refinedPuzzles = [
    { id: 1, fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solution: ['Qxf7#'], difficulty: 'easy', moves: 1, hint: 'Target the f7 square' },
    { id: 2, fen: '6k1/5ppp/8/8/8/8/1Q6/6K1 w - - 0 1', solution: ['Qb8#'], difficulty: 'easy', moves: 1, hint: 'Back rank mate' },
    { id: 3, fen: 'k7/1p6/1Q6/8/8/8/8/7K w - - 0 1', solution: ['Qb7#'], difficulty: 'easy', moves: 1, hint: 'Kiss of death' },
    { id: 4, fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1', solution: ['Qh4#'], difficulty: 'easy', moves: 1, hint: 'Fool\'s mate' },
    { id: 5, fen: '3rk2r/pppb1ppp/8/8/8/8/4Q3/7K w - - 0 1', solution: ['Qxe7#'], difficulty: 'easy', moves: 1, hint: 'Capture the defender' },
    { id: 6, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solution: ['Qxf7#'], difficulty: 'easy', moves: 1, hint: 'Mating on f7' },
    { id: 7, fen: '5rk1/5ppp/8/8/8/8/3R4/6K1 w - - 0 1', solution: ['Rd8#'], difficulty: 'easy', moves: 1, hint: 'Rank 8 checkmate' },
    { id: 8, fen: '6k1/R5pp/8/8/8/8/8/7K w - - 0 1', solution: ['Ra8#'], difficulty: 'easy', moves: 1, hint: 'Rook mate on top' },
    { id: 9, fen: '2r3k1/5ppp/8/8/8/8/2B5/6K1 w - - 0 1', solution: ['Bh7#'], difficulty: 'easy', moves: 1, hint: 'Bishop delivery' }, // This isn't mate. Bishop on c2 check on h7. King g8. Solution must be mate.
    { id: 10, fen: '2r3k1/1p3ppp/8/1N6/8/8/8/7K w - - 0 1', solution: ['Ne7#'], difficulty: 'easy', moves: 1, hint: 'Knight check' } // This isn't mate.
];

// Re-generating 10 PERFECT 1-move checkmates
const perfectPuzzles = [
    { id: 1, fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solution: ['Qxf7#'], difficulty: 'easy', moves: 1, hint: 'Target f7' },
    { id: 2, fen: '6k1/5ppp/8/8/8/8/2R5/6K1 w - - 0 1', solution: ['Rc8#'], difficulty: 'easy', moves: 1, hint: 'Back rank' },
    { id: 3, fen: 'k7/1p6/2Q5/8/8/8/8/7K w - - 0 1', solution: ['Qa8#'], difficulty: 'easy', moves: 1, hint: 'Edge of the board' },
    { id: 4, fen: 'rnb1kbnr/pppp1ppp/8/4p3/5P1q/8/PPPPP1PP/RNBQKBNR w KQkq - 0 1', solution: ['g3'], difficulty: 'easy', moves: 1, hint: 'Block the check' }, // Wait, needs to be checkmate
    { id: 5, fen: 'rnbqk1nr/pppp1ppp/8/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solution: ['Qxf7#'], difficulty: 'easy', moves: 1, hint: 'f7 attack' },
    { id: 6, fen: '4k3/R7/4K3/8/8/8/8/8 w - - 0 1', solution: ['Ra8#'], difficulty: 'easy', moves: 1, hint: 'Common king and rook' },
    { id: 7, fen: '7k/R6p/8/8/8/8/8/6K1 w - - 0 1', solution: ['Rh7#'], difficulty: 'easy', moves: 1, hint: 'Attack from side' }, // Wait, Rh7 isn't mate. King can take. Need support.
    { id: 8, fen: 'k7/8/1K6/8/8/8/8/R7 w - - 0 1', solution: ['Ra8#'], difficulty: 'easy', moves: 1, hint: 'Opposition' },
    { id: 9, fen: '2k5/R7/2K5/8/8/8/8/8 w - - 0 1', solution: ['Ra8#'], difficulty: 'easy', moves: 1, hint: 'Trapped' },
    { id: 10, fen: 'k7/8/K7/8/8/8/8/Q7 w - - 0 1', solution: ['Qa8#'], difficulty: 'easy', moves: 1, hint: 'Cornered' }
];

console.log('Verifying...');
perfectPuzzles.forEach(p => {
    const chess = new Chess(p.fen);
    const move = chess.move(p.solution[0]);
    if (!move) {
        console.log(`Puzzle ${p.id} move is ILLEGAL!`);
    } else if (!chess.isCheckmate()) {
        console.log(`Puzzle ${p.id} is NOT checkmate!`);
    } else {
        console.log(`Puzzle ${p.id} VERIFIED.`);
    }
});
