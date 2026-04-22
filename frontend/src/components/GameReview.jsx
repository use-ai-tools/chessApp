import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import WinProbabilityBar from './WinProbabilityBar';

const CLASS_CONFIG = {
  brilliant: { icon: '‼', label: 'Brilliant', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', hex: '#22d3ee' },
  great:     { icon: '!', label: 'Great', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', hex: '#60a5fa' },
  best:      { icon: '★', label: 'Best', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', hex: '#10b981' },
  excellent: { icon: '★', label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', hex: '#4ade80' },
  good:      { icon: '●', label: 'Good', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', hex: '#94a3b8' },
  inaccuracy:{ icon: '?!', label: 'Inaccuracy', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', hex: '#facc15' },
  mistake:   { icon: '?', label: 'Mistake', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', hex: '#fb923c' },
  blunder:   { icon: '??', label: 'Blunder', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', hex: '#f87171' },
};

function createBadge(icon, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${color}" stroke="#1e293b" stroke-width="2"/><text x="16" y="21" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${icon}</text></svg>`;
  return \`url("data:image/svg+xml;utf8,\${encodeURIComponent(svg)}")\`;
}

export default function GameReview({ moves, review, playerColor, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = start position
  const moveListRef = useRef(null);

  const classifications = review?.classifications || [];

  // Compute FEN at every position
  const positions = useMemo(() => {
    const fens = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'];
    const game = new Chess();
    for (const san of moves) {
      try {
        game.move(san);
        fens.push(game.fen());
      } catch { break; }
    }
    return fens;
  }, [moves]);

  // Compute last move {from, to} for each position
  const moveDetails = useMemo(() => {
    const details = [null]; // no last move for starting position
    const game = new Chess();
    for (const san of moves) {
      try {
        const move = game.move(san);
        details.push({ from: move.from, to: move.to });
      } catch { break; }
    }
    return details;
  }, [moves]);

  const currentFen = positions[currentIndex + 1] || positions[0];
  const currentLastMove = moveDetails[currentIndex + 1] || null;
  const currentClassification = currentIndex >= 0 ? classifications[currentIndex] : null;
  const config = currentClassification ? CLASS_CONFIG[currentClassification.classification] : null;

  // Auto-scroll move list to active move
  useEffect(() => {
    if (moveListRef.current) {
      const activeBtn = moveListRef.current.querySelector('.move-active');
      if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(-1, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(moves.length - 1, i + 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moves.length, onClose]);

  // Pair moves for display
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: { san: moves[i], index: i, cls: classifications[i] },
      black: i + 1 < moves.length ? { san: moves[i + 1], index: i + 1, cls: classifications[i + 1] } : null,
    });
  }

  const whiteSummary = review?.white || {};
  const blackSummary = review?.black || {};
  const mySummary = playerColor === 'w' ? whiteSummary : blackSummary;

  // Square styles: highlight last move + classification
  const squareStyles = {};
  if (currentLastMove) {
    squareStyles[currentLastMove.from] = { backgroundColor: 'rgba(246,246,105,0.5)' };
    squareStyles[currentLastMove.to] = { backgroundColor: 'rgba(246,246,105,0.5)' };
    
    if (config && config.icon && config.hex) {
      squareStyles[currentLastMove.to].backgroundImage = createBadge(config.icon, config.hex);
      squareStyles[currentLastMove.to].backgroundRepeat = 'no-repeat';
      squareStyles[currentLastMove.to].backgroundPosition = 'top right';
      squareStyles[currentLastMove.to].backgroundSize = '35%';
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2" tabIndex={0}>
      <div className="bg-navy-900 border border-navy-700/50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700/30">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📊 Game Review
          </h2>
          <button onClick={onClose} className="btn-ghost btn-sm text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Board + Win Bar */}
          <div className="flex items-center gap-2 p-4 justify-center">
            {/* FEATURE 4: Win probability bar visible in review */}
            <WinProbabilityBar fen={currentFen} height={380} />
            <div className="flex flex-col gap-2">
              {/* Current move classification banner ABOVE the board */}
              {config ? (
                <div className={`p-2 rounded-none ${config.bg} border ${config.border} flex items-center gap-2 h-12`}>
                  <span className={`font-black text-lg ${config.color}`}>{config.icon}</span>
                  <span className={`text-sm font-bold ${config.color}`}>{config.label} Move</span>
                  {currentClassification?.reason && <span className="text-[10px] text-slate-300 ml-2 hidden sm:inline">{currentClassification.reason}</span>}
                  <span className="text-xs text-slate-400 ml-auto">Move {currentIndex + 1}</span>
                </div>
              ) : (
                <div className="h-12 flex items-center p-2"><span className="text-slate-500 text-xs">Game Start</span></div>
              )}
              
              <Chessboard
                position={currentFen}
                boardWidth={380}
                arePiecesDraggable={false}
                boardOrientation={playerColor === 'b' ? 'black' : 'white'}
                customBoardStyle={{ borderRadius: '0px' }}
                customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
                customSquareStyles={squareStyles}
                animationDuration={150}
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-navy-700/30 min-w-0">
            {/* Navigation ABOVE move list */}
            <div className="p-2 border-b border-navy-700/30 flex items-center justify-center gap-2 bg-navy-800/50">
              <NavBtn onClick={() => setCurrentIndex(-1)} disabled={currentIndex === -1}>⏮</NavBtn>
              <NavBtn onClick={() => setCurrentIndex(i => Math.max(-1, i - 1))} disabled={currentIndex === -1}>◀</NavBtn>
              <span className="text-xs text-slate-500 w-14 text-center font-mono">
                {currentIndex + 1}/{moves.length}
              </span>
              <NavBtn onClick={() => setCurrentIndex(i => Math.min(moves.length - 1, i + 1))} disabled={currentIndex >= moves.length - 1}>▶</NavBtn>
              <NavBtn onClick={() => setCurrentIndex(moves.length - 1)} disabled={currentIndex >= moves.length - 1}>⏭</NavBtn>
            </div>

            {/* Summary cards */}
            <div className="p-3 border-b border-navy-700/30">
              <h4 className="text-xs text-slate-500 font-bold uppercase mb-2">Your Move Quality</h4>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(CLASS_CONFIG).filter(([k]) => ['brilliant','great','best','excellent'].includes(k)).map(([key, cfg]) => (
                  <div key={key} className={`p-1 rounded-none ${cfg.bg} text-center`}>
                    <p className={`text-sm sm:text-lg font-black ${cfg.color}`}>{mySummary[key] || 0}</p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400">{cfg.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {Object.entries(CLASS_CONFIG).filter(([k]) => ['good','inaccuracy','mistake','blunder'].includes(k)).map(([key, cfg]) => (
                  <div key={key} className={`p-1 rounded-none ${cfg.bg} text-center`}>
                    <p className={`text-sm sm:text-lg font-black ${cfg.color}`}>{mySummary[key] || 0}</p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400">{cfg.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Move list (Horizontal) */}
            <div ref={moveListRef} className="flex overflow-x-auto gap-2 p-3 pb-4 scrollbar-thin snap-x bg-navy-900/50 border-t border-navy-700/30">
              {pairs.map((pair) => (
                <div key={pair.number} className="flex items-center gap-1 flex-shrink-0 bg-navy-800/50 rounded px-2 py-1 snap-end">
                  <span className="text-slate-500 text-xs font-bold mr-1">{pair.number}.</span>
                  <MoveBtn
                    san={pair.white.san}
                    cls={pair.white.cls}
                    isActive={pair.white.index === currentIndex}
                    onClick={() => setCurrentIndex(pair.white.index)}
                    isWhite
                  />
                  {pair.black && (
                    <MoveBtn
                      san={pair.black.san}
                      cls={pair.black.cls}
                      isActive={pair.black.index === currentIndex}
                      onClick={() => setCurrentIndex(pair.black.index)}
                      isWhite={false}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveBtn({ san, cls, isActive, onClick, isWhite }) {
  const classification = cls?.classification;
  const cfg = classification ? CLASS_CONFIG[classification] : null;
  const badge = cfg && classification !== 'good' ? cfg.icon : null;

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-0.5 ${isActive ? 'move-active' : ''} ${
        isActive
          ? 'bg-chess-green/20 text-chess-green ring-1 ring-chess-green/30'
          : isWhite ? 'text-sky-300 hover:bg-white/10' : 'text-purple-300 hover:bg-white/10'
      }`}
    >
      {san}
      {badge && <span className={`text-[9px] font-black ${cfg.color}`}>{badge}</span>}
    </button>
  );
}

function NavBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
        disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
