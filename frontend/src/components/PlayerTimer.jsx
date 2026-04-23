import React, { useEffect, useRef } from 'react';
import { playSound } from './ChessBoard';

export default function PlayerTimer({
  player,
  time,
  isActive,
  color,
  captured,
  materialAdvantage,
  gameStatus,
}) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Play subtle tick when time hits 10s (only once)
  const warnedRef = useRef(false);
  useEffect(() => {
    if (isActive && time === 10 && !warnedRef.current) {
      warnedRef.current = true;
      playSound('lowTime');
    }
    if (time > 10) warnedRef.current = false;
  }, [time, isActive]);

  return (
    <div
      className={`w-full max-w-[560px] flex items-center justify-between px-3 py-2 rounded-none border transition-all duration-300 ${
        isActive
          ? 'bg-gold-500/10 border-gold-500/30'
          : 'bg-navy-800/50 border-navy-700/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              color === 'white'
                ? 'bg-slate-200 text-slate-800'
                : 'bg-slate-800 text-slate-200 border border-slate-600'
            }`}
          >
            {player?.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full animate-pulse" />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{player?.username || 'Waiting...'}</p>
          {captured && captured.length > 0 && (
            <div className="captured-pieces">
              {captured.map((p, i) => (
                <span key={i} className="text-xs opacity-80">{p}</span>
              ))}
              {materialAdvantage > 0 && (
                <span className="material-advantage">+{materialAdvantage}</span>
              )}
            </div>
          )}
          {(!captured || captured.length === 0) && (
            <p className="text-[10px] text-slate-500 capitalize">{color}</p>
          )}
        </div>
      </div>

      {/* Timer */}
      <div
        className={`px-2 py-1 rounded font-mono text-xs font-bold flex items-center gap-1 transition-all duration-300 ${
          isActive
            ? time <= 5
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : time <= 10
              ? 'bg-yellow-500/15 text-yellow-400'
              : 'bg-gold-500/15 text-gold-400'
            : 'bg-navy-700/50 text-slate-400'
        }`}
      >
        🕑 {formatTime(time)}
      </div>
    </div>
  );
}
