import React from 'react';

export default function PlayerTimer({
  player,
  time,
  isActive,
  color,
  captured,
  materialAdvantage,
  gameStatus, // BUG 6: needed to show waiting state
}) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // BUG 6 FIX: Show waiting indicator before timer starts
  const isWaitingFirstMove = gameStatus === 'playing' && time >= 30 && !isActive;

  return (
    <div
      className={`w-full max-w-[560px] flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 ${
        isActive
          ? 'bg-gold-500/10 border-gold-500/30 shadow-sm shadow-gold-500/10'
          : 'bg-navy-800/50 border-navy-700/30'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              color === 'white'
                ? 'bg-slate-200 text-slate-800'
                : 'bg-slate-800 text-slate-200 border border-slate-600'
            }`}
          >
            {player?.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{player?.username || 'Waiting...'}</p>
          {/* Captured pieces row */}
          {captured && captured.length > 0 && (
            <div className="captured-pieces">
              {captured.map((p, i) => (
                <span key={i} className="text-sm opacity-80 piece-capture-in">{p}</span>
              ))}
              {materialAdvantage > 0 && (
                <span className="material-advantage">+{materialAdvantage}</span>
              )}
            </div>
          )}
          {(!captured || captured.length === 0) && (
            <p className="text-xs text-slate-500 capitalize">{color}</p>
          )}
        </div>
      </div>

      {/* Timer */}
      <div
        className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
          isActive
            ? time <= 5
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : time <= 10
              ? 'bg-yellow-500/15 text-yellow-400'
              : 'bg-gold-500/15 text-gold-400'
            : 'bg-navy-700/50 text-slate-400'
        }`}
      >
        <span>🕑</span>
        {formatTime(time)}
      </div>
    </div>
  );
}
