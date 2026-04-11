import React, { useState, useEffect } from 'react';

const CHESS_PIECES = ['♔', '♕', '♖', '♗', '♘', '♙'];

export default function MatchmakingOverlay({
  contestType,
  elo,
  eloRange,
  waitTime,
  onCancel,
  opponentFound,
  opponent,
  countdown,
}) {
  const [currentPiece, setCurrentPiece] = useState(0);
  const [dots, setDots] = useState('.');

  // Cycling chess piece
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentPiece(i => (i + 1) % CHESS_PIECES.length);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // Dots animation
  useEffect(() => {
    const iv = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.');
    }, 600);
    return () => clearInterval(iv);
  }, []);

  // ELO range display
  const getEloRangeText = () => {
    if (waitTime >= 60) return 'Any';
    if (waitTime >= 30) return `±400`;
    return `±${eloRange || 200}`;
  };

  if (opponentFound) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-sm w-full animate-scale-in">
          <div className="card p-8 text-center border-chess-green/20">
            {/* Opponent avatar */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-chess-green to-emerald-600 flex items-center justify-center shadow-2xl shadow-chess-green/30 animate-pulse-gold">
                <span className="text-4xl font-black text-white">
                  {opponent?.username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 badge-green text-xs">
                ELO {opponent?.elo || '—'}
              </div>
            </div>

            <h2 className="text-xl font-black text-white mb-1">Opponent Found!</h2>
            <p className="text-lg font-bold text-chess-green mb-4">{opponent?.username || 'Player'}</p>

            {/* Countdown */}
            <div className="mb-4">
              <div className="text-6xl font-black text-chess-green animate-bounce-in" key={countdown}>
                {countdown}
              </div>
              <p className="text-sm text-slate-400 mt-2">Match starting{dots}</p>
            </div>

            {/* VS badges */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-slate-500">You</p>
                <p className="text-sm font-bold text-white">{elo}</p>
              </div>
              <span className="text-2xl font-black text-gold-400">VS</span>
              <div className="text-center">
                <p className="text-xs text-slate-500">Opponent</p>
                <p className="text-sm font-bold text-white">{opponent?.elo || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-sm w-full animate-scale-in">
        <div className="card p-8 text-center">
          {/* Animated chess piece spinner */}
          <div className="relative mb-8">
            <div className="w-28 h-28 mx-auto rounded-full border-4 border-navy-700/50 flex items-center justify-center relative">
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-chess-green animate-spin" />
              {/* Chess piece */}
              <span className="text-5xl transition-all duration-300" style={{ filter: 'drop-shadow(0 0 8px rgba(129,182,76,0.3))' }}>
                {CHESS_PIECES[currentPiece]}
              </span>
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border-2 border-chess-green/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          <h2 className="text-xl font-black text-white mb-2">Finding Opponent{dots}</h2>

          {/* Contest info */}
          {contestType && (
            <div className="mb-4 p-3 rounded-xl bg-navy-800/80 border border-navy-700/30">
              <p className="text-sm font-bold text-chess-green">{contestType.name}</p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="text-slate-400">Entry: <span className="text-white font-bold">₹{contestType.entry}</span></span>
                <span className="text-slate-400">Prize: <span className="text-gold-400 font-bold">₹{contestType.payout}</span></span>
              </div>
            </div>
          )}

          {/* ELO and timer */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="px-4 py-2 rounded-xl bg-navy-800/60 border border-navy-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Your ELO</p>
              <p className="text-lg font-black text-white">{elo || 1200}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-navy-800/60 border border-navy-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Range</p>
              <p className="text-lg font-black text-chess-green">{getEloRangeText()}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-navy-800/60 border border-navy-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Wait</p>
              <p className="text-lg font-black text-white">{waitTime || 0}s</p>
            </div>
          </div>

          {/* Range expansion notice */}
          {waitTime >= 25 && waitTime < 30 && (
            <p className="text-xs text-yellow-400 mb-4 animate-fade-in">⚡ Expanding to ±400 ELO in {30 - waitTime}s...</p>
          )}
          {waitTime >= 55 && waitTime < 60 && (
            <p className="text-xs text-yellow-400 mb-4 animate-fade-in">⚡ Matching with anyone in {60 - waitTime}s...</p>
          )}
          {waitTime >= 60 && (
            <p className="text-xs text-emerald-400 mb-4 animate-fade-in">🌐 Searching all players...</p>
          )}

          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-red-600/15 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-600/25 transition-all active:scale-[0.98]"
          >
            ✕ Cancel — Get Refund
          </button>

          <p className="text-[10px] text-slate-600 mt-3">Entry fee refunded on cancel</p>
        </div>
      </div>
    </div>
  );
}
