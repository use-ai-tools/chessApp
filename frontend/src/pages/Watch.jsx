import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import GM_GAMES from '../data/gmGames';

const BOARD_THEMES = {
  green: { light: '#eeeed2', dark: '#769656' },
};

const PIECE_UNICODE = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛',
};
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export default function Watch() {
  const game = GM_GAMES[0];
  const containerRef = useRef(null);
  const moveListRef = useRef(null);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [boardSize, setBoardSize] = useState(400);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const autoPlayRef = useRef(null);

  // Precompute ALL positions for instant navigation
  const positions = useMemo(() => {
    const chess = new Chess();
    const result = [{ fen: chess.fen(), lastMove: null }];
    for (const san of game.moves) {
      const m = chess.move(san);
      if (m) {
        result.push({ fen: chess.fen(), lastMove: { from: m.from, to: m.to } });
      } else {
        break; // Stop at first invalid move
      }
    }
    return result;
  }, [game]);

  const totalMoves = positions.length - 1; // -1 because index 0 is starting position
  const currentPos = positions[moveIndex + 1] || positions[0];
  const fen = currentPos.fen;
  const lastMove = currentPos.lastMove;
  const gameEnded = moveIndex >= totalMoves - 1;
  const turn = moveIndex >= 0 ? (moveIndex % 2 === 0 ? 'b' : 'w') : 'w';

  // Captured pieces from FEN
  const getCaptured = useCallback((fenStr) => {
    const startingPieces = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const current = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    const boardPart = fenStr.split(' ')[0];
    for (const char of boardPart) {
      if ('pnbrq'.includes(char)) current.b[char]++;
      else if ('PNBRQ'.includes(char)) current.w[char.toLowerCase()]++;
    }
    const wCaptured = [], bCaptured = [];
    for (const piece of ['q', 'r', 'b', 'n', 'p']) {
      for (let i = 0; i < startingPieces[piece] - current.b[piece]; i++) wCaptured.push(PIECE_UNICODE[`b${piece}`]);
      for (let i = 0; i < startingPieces[piece] - current.w[piece]; i++) bCaptured.push(PIECE_UNICODE[`w${piece}`]);
    }
    const calcVal = (arr) => {
      const rev = {}; Object.entries(PIECE_UNICODE).forEach(([k, v]) => rev[v] = k);
      return arr.reduce((sum, p) => sum + (PIECE_VALUES[rev[p]?.[1]] || 0), 0);
    };
    const wAdv = calcVal(wCaptured) - calcVal(bCaptured);
    return { wCaptured, bCaptured, whiteAdv: Math.max(0, wAdv), blackAdv: Math.max(0, -wAdv) };
  }, []);

  const captured = getCaptured(fen);

  // Responsive board sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setBoardSize(Math.min(Math.floor(w), 640));
      }
    });
    ro.observe(containerRef.current);
    setBoardSize(Math.min(Math.floor(containerRef.current.offsetWidth), 640) || 400);
    return () => ro.disconnect();
  }, []);

  // Navigation functions
  const goToMove = useCallback((idx) => {
    const clamped = Math.max(-1, Math.min(idx, totalMoves - 1));
    setMoveIndex(clamped);
  }, [totalMoves]);

  const goFirst = () => goToMove(-1);
  const goPrev = () => goToMove(moveIndex - 1);
  const goNext = () => goToMove(moveIndex + 1);
  const goLast = () => goToMove(totalMoves - 1);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'Home') { e.preventDefault(); goFirst(); }
      if (e.key === 'End') { e.preventDefault(); goLast(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveIndex, totalMoves]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) {
      clearInterval(autoPlayRef.current);
      return;
    }
    if (gameEnded) {
      setIsAutoPlaying(false);
      return;
    }
    autoPlayRef.current = setInterval(() => {
      setMoveIndex(prev => {
        const next = prev + 1;
        if (next >= totalMoves) {
          setIsAutoPlaying(false);
          return totalMoves - 1;
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, totalMoves, gameEnded]);

  // Auto-scroll move history to current move
  useEffect(() => {
    if (!moveListRef.current) return;
    const activeEl = moveListRef.current.querySelector('[data-active="true"]');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [moveIndex]);

  const theme = BOARD_THEMES.green;
  const lastMoveStyles = lastMove ? {
    [lastMove.from]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
    [lastMove.to]: { backgroundColor: 'rgba(246, 246, 105, 0.5)' },
  } : {};

  // Move pairs for display
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < game.moves.length && i < totalMoves; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: game.moves[i],
        whiteIdx: i,
        black: game.moves[i + 1] || null,
        blackIdx: i + 1 < totalMoves ? i + 1 : null,
      });
    }
    return pairs;
  }, [game.moves, totalMoves]);

  // Result info
  const getResultText = () => {
    if (game.result === '1-0') return { text: 'White wins', winner: game.white, icon: '♔' };
    if (game.result === '0-1') return { text: 'Black wins', winner: game.black, icon: '♚' };
    return { text: 'Draw', winner: null, icon: '½' };
  };

  const NavButton = ({ onClick, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-all ${
        disabled
          ? 'bg-white/[0.02] text-slate-700 cursor-not-allowed'
          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white active:scale-95'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full bg-hero flex-1 px-3 py-4 md:px-6 md:py-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-black text-white">Game Review</h1>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {game.event} {game.year}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

          {/* ── Board Section ── */}
          <div className="flex-1 max-w-[640px] mx-auto lg:mx-0 w-full">

            {/* Top player (Black) */}
            <div className="flex items-center justify-between px-3 py-2 bg-navy-800/40 border-b border-navy-700/15">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 border border-slate-600 flex items-center justify-center text-[10px] font-bold">
                  {game.black.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{game.black}</p>
                  <p className="text-[9px] text-slate-500">{game.blackElo}</p>
                </div>
                {/* Captured by black (white pieces) */}
                {captured.bCaptured.length > 0 && (
                  <div className="flex items-center gap-0 ml-2">
                    {captured.bCaptured.map((p, i) => (
                      <span key={i} className="text-[11px] opacity-70 -ml-0.5">{p}</span>
                    ))}
                    {captured.blackAdv > 0 && <span className="text-[9px] font-bold text-chess-green ml-1">+{captured.blackAdv}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Board */}
            <div ref={containerRef} className="w-full aspect-square">
              <Chessboard
                position={fen}
                boardWidth={boardSize}
                boardOrientation="white"
                arePiecesDraggable={false}
                customBoardStyle={{ borderRadius: '0px' }}
                customDarkSquareStyle={{ backgroundColor: theme.dark }}
                customLightSquareStyle={{ backgroundColor: theme.light }}
                customSquareStyles={lastMoveStyles}
                animationDuration={250}
              />
            </div>

            {/* Bottom player (White) */}
            <div className="flex items-center justify-between px-3 py-2 bg-navy-800/40 border-t border-navy-700/15">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                  {game.white.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{game.white}</p>
                  <p className="text-[9px] text-slate-500">{game.whiteElo}</p>
                </div>
                {/* Captured by white (black pieces) */}
                {captured.wCaptured.length > 0 && (
                  <div className="flex items-center gap-0 ml-2">
                    {captured.wCaptured.map((p, i) => (
                      <span key={i} className="text-[11px] opacity-70 -ml-0.5">{p}</span>
                    ))}
                    {captured.whiteAdv > 0 && <span className="text-[9px] font-bold text-chess-green ml-1">+{captured.whiteAdv}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* ── Navigation Controls ── */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <NavButton onClick={goFirst} disabled={moveIndex <= -1} title="First move (Home)">⏮</NavButton>
              <NavButton onClick={goPrev} disabled={moveIndex <= -1} title="Previous (←)">◀</NavButton>

              {/* Auto-play toggle — small */}
              <button
                onClick={() => {
                  if (gameEnded) { goToMove(-1); setIsAutoPlaying(true); }
                  else setIsAutoPlaying(!isAutoPlaying);
                }}
                title={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
                className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                  isAutoPlaying
                    ? 'bg-chess-green/15 text-chess-green'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white active:scale-95'
                }`}
              >
                {isAutoPlaying ? '⏸' : '▶'}
              </button>

              <NavButton onClick={goNext} disabled={gameEnded} title="Next (→)">▶</NavButton>
              <NavButton onClick={goLast} disabled={gameEnded} title="Last move (End)">⏭</NavButton>
            </div>

            {/* Move counter */}
            <div className="flex items-center justify-center mt-2 gap-3">
              <span className="text-[10px] text-slate-500 font-medium">
                Move {moveIndex < 0 ? 0 : moveIndex + 1} / {totalMoves}
              </span>
              <div className="w-32 h-1 rounded-full bg-navy-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-chess-green/50 transition-all duration-200"
                  style={{ width: `${((moveIndex + 1) / totalMoves) * 100}%` }}
                />
              </div>
            </div>

            {/* Mobile: toggle move history */}
            <button
              onClick={() => setShowMobileHistory(!showMobileHistory)}
              className="lg:hidden w-full mt-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              {showMobileHistory ? '▲ Hide Moves' : '▼ Show Moves'}
            </button>

            {/* Mobile move history (collapsible) */}
            {showMobileHistory && (
              <div className="lg:hidden mt-2 bg-navy-800/30 rounded-xl max-h-[250px] overflow-y-auto p-3 animate-slide-down" style={{ scrollbarWidth: 'thin' }}>
                <MoveList
                  movePairs={movePairs}
                  moveIndex={moveIndex}
                  onClickMove={goToMove}
                  listRef={moveListRef}
                />
              </div>
            )}
          </div>

          {/* ── Right Panel (Desktop) ── */}
          <div className="hidden lg:flex lg:w-[320px] flex-col gap-4">

            {/* Game Info */}
            <div className="bg-navy-800/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">♟</span>
                <h3 className="text-sm font-bold text-white">{game.opening}</h3>
              </div>
              <div className="flex gap-4 text-[10px] text-slate-500">
                <span>{game.event} {game.year}</span>
                <span>•</span>
                <span>Result: <span className="text-white font-semibold">{game.result}</span></span>
              </div>
            </div>

            {/* Move History Panel */}
            <div className="bg-navy-800/30 rounded-xl flex-1 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '300px' }}>
              <div className="px-4 py-2.5 border-b border-navy-700/20 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Moves</h3>
                <span className="text-[10px] text-slate-600">{moveIndex + 1}/{totalMoves}</span>
              </div>
              <div ref={moveListRef} className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                <MoveList
                  movePairs={movePairs}
                  moveIndex={moveIndex}
                  onClickMove={goToMove}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Result Banner (when game ends) ── */}
        {gameEnded && (
          <div className="mt-6 bg-navy-800/40 border border-navy-700/20 rounded-2xl p-6 max-w-xl mx-auto animate-scale-in">
            <div className="text-center">
              <div className="text-4xl mb-2">{getResultText().icon}</div>
              <h2 className="text-lg font-bold text-white mb-1">{getResultText().text}</h2>
              {getResultText().winner && (
                <p className="text-sm text-chess-green font-semibold mb-1">{getResultText().winner}</p>
              )}
              <p className="text-xs text-slate-500 mb-4">{game.event} {game.year} • {game.opening}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { goToMove(-1); }}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 transition-all"
                >
                  Review Again
                </button>
                <button
                  onClick={() => { goToMove(-1); setIsAutoPlaying(true); }}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                >
                  Auto Replay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Move List Component ──
function MoveList({ movePairs, moveIndex, onClickMove, listRef }) {
  return (
    <div ref={listRef} className="space-y-0.5">
      {movePairs.map((pair, i) => (
        <div key={i} className="flex items-center text-xs font-mono">
          <span className="text-slate-600 w-7 text-right mr-1.5 text-[10px] select-none flex-shrink-0">{pair.num}.</span>
          <button
            data-active={moveIndex === pair.whiteIdx}
            onClick={() => onClickMove(pair.whiteIdx)}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all duration-100 min-w-[42px] text-left ${
              moveIndex === pair.whiteIdx
                ? 'bg-chess-green/20 text-chess-green font-bold'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            {pair.white}
          </button>
          {pair.black && pair.blackIdx !== null && (
            <button
              data-active={moveIndex === pair.blackIdx}
              onClick={() => onClickMove(pair.blackIdx)}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-all duration-100 min-w-[42px] text-left ${
                moveIndex === pair.blackIdx
                  ? 'bg-chess-green/20 text-chess-green font-bold'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {pair.black}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
