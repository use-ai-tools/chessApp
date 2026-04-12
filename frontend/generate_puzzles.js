const { Chess } = require('chess.js');

const puzzles = [];

function findOneMoveMate(fen) {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    for (const move of moves) {
        chess.move(move);
        if (chess.isCheckmate()) {
            const san = move.san;
            chess.undo();
            return san;
        }
        chess.undo();
    }
    return null;
}

const candidates = [
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', // f7 mate
    '6k1/5ppp/8/8/8/8/2R5/6K1 w - - 0 1', // back rank rook
    'k7/1P6/2K5/8/8/8/8/8 w - - 0 1', // No
    '2k5/R7/2K5/8/8/8/8/8 w - - 0 1', // Ra8 mate
    'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1', // Fool's mate
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1', // Not mate
    '3k4/3P4/3K4/8/8/8/8/8 w - - 0 1', // No
    'k7/8/2K5/1Q6/8/8/8/8 w - - 0 1', // Qb7 mate
    '1k6/1P6/1K6/8/8/8/8/8 w - - 0 1', // No
    '2k5/2P5/2K5/8/8/8/8/8 w - - 0 1', // No
    'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', // f7 mate
    '4k3/R7/5K2/8/8/8/8/8 w - - 0 1', // Ra8 mate
    '1k6/R7/1K6/8/8/8/8/8 w - - 0 1', // Not mate
    'k7/1R6/1K6/8/8/8/8/1R6 w - - 0 1', // No
    'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', // f7 mate
    'rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 0 1', // Not mate
    '5k2/5P2/5K2/8/8/8/8/8 w - - 0 1', // No
    'k7/8/2K5/8/8/8/Q7/8 w - - 0 1', // Qa8 mate
    '2k5/8/2K5/8/8/8/R7/8 w - - 0 1', // Ra8 mate
    '7k/5K2/8/8/8/8/Q7/8 w - - 0 1', // Qg7 mate
];

let id = 1;
for (const fen of candidates) {
    const solution = findOneMoveMate(fen);
    if (solution) {
        puzzles.push({
            id: id++,
            fen: fen,
            solution: [solution],
            difficulty: 'easy',
            moves: 1,
            hint: 'Win the game in one move'
        });
    }
    if (puzzles.length >= 10) break;
}

console.log(JSON.stringify(puzzles, null, 2));
