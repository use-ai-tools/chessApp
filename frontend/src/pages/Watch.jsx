import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import GM_GAMES from '../data/gmGames';

const BOARD_THEMES = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  green: { light: '#eeeed2', dark: '#769656' },
};

export default function Watch() {
  const game = GM_GAMES[0];
  const chessRef = useRef(new Chess());
  const containerRef = useRef(null);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [boardSize, setBoardSize] = useState(400);
  const [lastMove, setLastMove] = useState(null);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const timerRef = useRef(null);

  // Responsive board sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setBoardSize(Math.min(Math.floor(w), 560));
      }
    });
    ro.observe(containerRef.current);
    setBoardSize(Math.min(Math.floor(containerRef.current.offsetWidth), 560) || 400);
    return () => ro.disconnect();
  }, []);

  // Auto-play engine
  useEffect(() => {
    if (!isPlaying || gameEnded) return;

    const getDelay = () => {
      // Realistic thinking time: 1.5-4s at 1x, faster in endgame
      const baseMin = moveIndex > 60 ? 800 : moveIndex > 40 ? 1200 : 1500;
      const baseMax = moveIndex > 60 ? 2000 : moveIndex > 40 ? 3000 : 4000;
      const delay = baseMin + Math.random() * (baseMax - baseMin);
      return delay / speed;
    };

    timerRef.current = setTimeout(() => {
      const nextIdx = moveIndex + 1;
      if (nextIdx >= game.moves.length) {
        setGameEnded(true);
        setIsPlaying(false);
        // Loop: restart after 6 seconds
        setTimeout(() => {
          resetGame();
          setIsPlaying(true);
        }, 6000);
        return;
      }

      const chess = new Chess();
      const movesUpTo = game.moves.slice(0, nextIdx + 1);
      let lastM = null;
      for (const san of movesUpTo) {
        const m = chess.move(san);
        if (m) lastM = { from: m.from, to: m.to };
      }

      setFen(chess.fen());
      setMoveIndex(nextIdx);
      setMoveHistory(movesUpTo);
      if (lastM) setLastMove(lastM);

      // Simulate timer decrease
      const timeDecrease = (1 + Math.random() * 6);
      if (nextIdx % 2 === 0) {
        setWhiteTime(prev => Math.max(0, prev - timeDecrease));
      } else {
        setBlackTime(prev => Math.max(0, prev - timeDecrease));
      }
    }, getDelay());

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, moveIndex, speed, gameEnded]);

  const resetGame = useCallback(() => {
    chessRef.current = new Chess();
    setMoveIndex(-1);
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setLastMove(null);
    setWhiteTime(300);
    setBlackTime(300);
    setMoveHistory([]);
    setGameEnded(false);
  }, []);

  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const theme = BOARD_THEMES.green;
  const turn = moveIndex >= 0 ? (moveIndex % 2 === 0 ? 'b' : 'w') : 'w';

  const lastMoveStyles = lastMove ? {
    [lastMove.from]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
    [lastMove.to]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
  } : {};

  // Move history pairs for display
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || null,
    });
  }

  return (
    <div className="w-full bg-hero flex-1 px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black text-white">Watch Games</h1>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Replay
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Board Section */}
          <div className="flex-1 max-w-[560px]">
            {/* Top player (Black) */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl mb-0 transition-all ${
              turn === 'b' ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-navy-800/50 border border-navy-700/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 border border-slate-600 flex items-center justify-center text-xs font-bold">
                  {game.black.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{game.black}</p>
                  <p className="text-[9px] text-slate-500">{game.blackElo}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded font-mono text-xs font-bold ${
                turn === 'b' ? 'bg-gold-500/15 text-gold-400' : 'bg-navy-700/50 text-slate-400'
              }`}>
                {formatTime(blackTime)}
              </div>
            </div>

            {/* Board */}
            <div ref={containerRef} className="w-full aspect-square shadow-2xl shadow-black/50">
              <Chessboard
                position={fen}
                boardWidth={boardSize}
                boardOrientation="white"
                arePiecesDraggable={false}
                customBoardStyle={{ borderRadius: '0px' }}
                customDarkSquareStyle={{ backgroundColor: theme.dark }}
                customLightSquareStyle={{ backgroundColor: theme.light }}
                customSquareStyles={lastMoveStyles}
                animationDuration={200}
              />
            </div>

            {/* Bottom player (White) */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-b-xl mt-0 transition-all ${
              turn === 'w' ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-navy-800/50 border border-navy-700/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold">
                  {game.white.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{game.white}</p>
                  <p className="text-[9px] text-slate-500">{game.whiteElo}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded font-mono text-xs font-bold ${
                turn === 'w' ? 'bg-gold-500/15 text-gold-400' : 'bg-navy-700/50 text-slate-400'
              }`}>
                {formatTime(whiteTime)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => { resetGame(); setIsPlaying(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ⏮ Reset
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 transition-all"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <div className="flex items-center gap-1">
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      speed === s ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:w-80 flex flex-col gap-4">
            {/* Game Info */}
            <div className="bg-navy-800/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">{game.event} {game.year}</h3>
              <p className="text-xs text-slate-500 mb-1">{game.opening}</p>
              <div className="flex gap-3 text-xs mt-3">
                <div>
                  <span className="text-slate-600">Moves </span>
                  <span className="text-white font-semibold">{moveHistory.length}/{game.moves.length}</span>
                </div>
                <div>
                  <span className="text-slate-600">Result </span>
                  <span className="text-chess-green font-semibold">{gameEnded ? game.result : '...'}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1 rounded-full bg-navy-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-chess-green/60 transition-all duration-300"
                  style={{ width: `${((moveIndex + 1) / game.moves.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Move History */}
            <div className="bg-navy-800/30 rounded-xl flex-1 max-h-[400px] overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-navy-700/20">
                <h3 className="text-xs font-bold text-slate-400">Move History</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                {movePairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs font-mono">
                    <span className="text-slate-600 w-6 text-right mr-1">{pair.num}.</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      moveIndex === i * 2 ? 'bg-chess-green/20 text-chess-green' : 'text-sky-300'
                    }`}>
                      {pair.white}
                    </span>
                    {pair.black && (
                      <span className={`px-1.5 py-0.5 rounded ${
                        moveIndex === i * 2 + 1 ? 'bg-chess-green/20 text-chess-green' : 'text-purple-300'
                      }`}>
                        {pair.black}
                      </span>
                    )}
                  </div>
                ))}
                {gameEnded && (
                  <div className="text-center text-xs text-chess-green font-bold mt-2 py-2 bg-chess-green/5 rounded-lg">
                    {game.result} — {game.result === '1-0' ? game.white : game.black} wins!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
