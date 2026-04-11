import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function ChessPanel({ 
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onMove,
  currentPlayer = null,
  whitePlayer = null,
  blackPlayer = null,
  isSpectator = false,
  gameStatus = 'playing',
  boardOrientation = 'white'
}) {
  const [game] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState([]);
  const [validMoves, setValidMoves] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Update game state when fen changes
  useEffect(() => {
    try {
      if (fen && fen !== game.fen()) {
        game.load(fen);
      }
      calculateValidMoves();
    } catch (e) {
      console.error('Invalid FEN:', e);
    }
  }, [fen, game]);

  // Calculate valid moves for current position
  const calculateValidMoves = () => {
    const moves = {};
    game.moves({ verbose: true }).forEach(move => {
      if (!moves[move.from]) {
        moves[move.from] = [];
      }
      moves[move.from].push(move.to);
    });
    setValidMoves(moves);
  };

  // Check if current player can move
  const canMakeMove = () => {
    if (isSpectator) return false;
    if (gameStatus !== 'playing') return false;
    if (!currentPlayer) return false;
    
    const isWhiteTurn = game.turn() === 'w';
    if (isWhiteTurn && currentPlayer.color === 'white') return true;
    if (!isWhiteTurn && currentPlayer.color === 'black') return true;
    return false;
  };

  const onSquareClick = (square) => {
    if (!canMakeMove()) return;

    // If square has valid moves, show them
    if (validMoves[square]) {
      setSelectedSquare(square);
      return;
    }

    // If selected square exists and target is valid, make move
    if (selectedSquare && validMoves[selectedSquare]?.includes(square)) {
      makeMove(selectedSquare, square);
      setSelectedSquare(null);
    }
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (!canMakeMove()) return false;

    // Try to make the move
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move) {
      onMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
        san: move.san, // Standard algebraic notation
      });
      addToMoveHistory(move.san);
      calculateValidMoves();
      return true;
    }
    return false;
  };

  const makeMove = (from, to) => {
    const move = game.move({
      from,
      to,
      promotion: 'q',
    });

    if (move) {
      onMove({
        from,
        to,
        promotion: 'q',
        san: move.san,
      });
      addToMoveHistory(move.san);
      calculateValidMoves();
    }
  };

  const addToMoveHistory = (san) => {
    setMoveHistory(prev => [...prev, san]);
  };

  const getTurnInfo = () => {
    if (gameStatus === 'checkmate') return 'Checkmate!';
    if (gameStatus === 'stalemate') return 'Stalemate!';
    if (gameStatus === 'draw') return 'Draw!';
    if (gameStatus !== 'playing') return 'Game Over';

    const isWhiteTurn = game.turn() === 'w';
    const turnPlayer = isWhiteTurn ? whitePlayer : blackPlayer;
    
    if (isSpectator) {
      return `${turnPlayer?.username}'s turn (${isWhiteTurn ? 'White' : 'Black'})`;
    }

    const isMyTurn = canMakeMove();
    return isMyTurn ? 'Your turn' : `${turnPlayer?.username}'s turn`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Turn Indicator */}
      <div className={`w-full max-w-md px-6 py-4 rounded-lg font-semibold text-center transition-all ${
        gameStatus === 'playing'
          ? 'bg-gradient-to-r from-sky-900/50 to-sky-800/50 border border-sky-700 text-sky-300'
          : 'bg-gradient-to-r from-amber-900/50 to-amber-800/50 border border-amber-700 text-amber-300'
      }`}>
        <div className="text-sm text-slate-400 mb-1">Status</div>
        <div className="text-lg">{getTurnInfo()}</div>
        {isSpectator && (
          <div className="text-xs text-slate-400 mt-2">👁️ Spectating</div>
        )}
      </div>

      {/* Player Info */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        {/* White Player */}
        <div className={`p-3 rounded-lg border ${
          game.turn() === 'w'
            ? 'bg-slate-700/80 border-yellow-500 ring-2 ring-yellow-400/50'
            : 'bg-slate-700/50 border-slate-600'
        }`}>
          <div className="text-xs text-slate-400 mb-1">White</div>
          <div className="font-semibold text-white">{whitePlayer?.username || 'Waiting...'}</div>
        </div>

        {/* Black Player */}
        <div className={`p-3 rounded-lg border ${
          game.turn() === 'b'
            ? 'bg-slate-700/80 border-yellow-500 ring-2 ring-yellow-400/50'
            : 'bg-slate-700/50 border-slate-600'
        }`}>
          <div className="text-xs text-slate-400 mb-1">Black</div>
          <div className="font-semibold text-white">{blackPlayer?.username || 'Waiting...'}</div>
        </div>
      </div>

      {/* Chessboard */}
      <div className={`bg-slate-900 p-4 rounded-lg shadow-2xl transition-all ${
        !canMakeMove() && !isSpectator ? 'opacity-75 cursor-not-allowed' : ''
      }`}>
        {canMakeMove() === false && !isSpectator && (
          <div className="absolute inset-0 rounded-lg bg-black/30 flex items-center justify-center">
            <span className="text-white font-semibold">Not your turn</span>
          </div>
        )}
        
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          boardOrientation={boardOrientation}
          boardWidth={420}
          customSquareStyles={{
            ...Object.keys(validMoves).reduce((acc, square) => {
              if (selectedSquare === square) {
                acc[square] = {
                  backgroundColor: 'rgba(59, 130, 246, 0.4)',
                  borderRadius: '4px',
                };
              }
              return acc;
            }, {}),
          }}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '3px solid rgb(30, 41, 59)',
          }}
          animationDuration={200}
        />
      </div>

      {/* Move History */}
      {moveHistory.length > 0 && (
        <div className="card w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">Move History</h4>
            <span className="text-xs text-slate-400">{moveHistory.length} moves</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* Display moves in pairs (white then black) */}
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="w-8 text-slate-500 font-semibold">{idx + 1}.</span>
                <span className="flex-1 px-2 py-1 bg-slate-700 rounded text-sky-300">
                  {moveHistory[idx * 2]}
                </span>
                {moveHistory[idx * 2 + 1] && (
                  <span className="flex-1 px-2 py-1 bg-slate-700 rounded text-purple-300">
                    {moveHistory[idx * 2 + 1]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Status Messages */}
      {gameStatus !== 'playing' && (
        <div className={`w-full max-w-md p-4 rounded-lg border text-center font-semibold ${
          gameStatus === 'checkmate'
            ? 'bg-green-900/30 border-green-700 text-green-400'
            : gameStatus === 'stalemate' || gameStatus === 'draw'
            ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
            : 'bg-red-900/30 border-red-700 text-red-400'
        }`}>
          Game {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
        </div>
      )}
    </div>
  );
}
