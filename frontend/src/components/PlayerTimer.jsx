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
  hideTimer = false,
  compact = false,
}) {
  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00';
    if (seconds < 10) {
      // <10s: show "9.5", "8.2" etc.
      const s = Math.floor(seconds);
      const tenths = Math.floor((seconds - s) * 10);
      return `${s}.${tenths}`;
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Play subtle tick when time crosses 10s threshold (only once)
  const warnedRef = useRef(false);
  useEffect(() => {
    if (isActive && time <= 10 && time > 0 && !warnedRef.current) {
      warnedRef.current = true;
      playSound('lowTime');
    }
    if (time > 10) warnedRef.current = false;
  }, [time, isActive]);

  return (
    <div
      className={`w-full flex items-center justify-between rounded-none border transition-all duration-200 ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2'
      } ${
        isActive
          ? 'bg-gold-500/10 border-gold-500/30'
          : 'bg-navy-800/50 border-navy-700/30'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`flex items-center justify-center font-bold ${
              compact ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'
            } rounded-full ${
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
        <div className="min-w-0">
          <p className={`font-semibold text-white truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {player?.username || 'Waiting...'}
          </p>
          {captured && captured.length > 0 ? (
            <div className="flex items-center gap-0.5 flex-wrap">
              {captured.map((p, i) => (
                <span key={i} className={`opacity-80 ${compact ? 'text-[10px]' : 'text-xs'}`}>{p}</span>
              ))}
              {materialAdvantage > 0 && (
                <span className={`font-bold text-chess-green ml-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>+{materialAdvantage}</span>
              )}
            </div>
          ) : (
            <p className={`text-slate-500 capitalize ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{color}</p>
          )}
        </div>
      </div>

      {/* Timer */}
      {!hideTimer && (
        <div
          className={`flex-shrink-0 rounded font-mono font-bold flex items-center gap-1 transition-all duration-200 ${
            compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'
          } ${
            isActive
              ? time <= 5
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : time <= 10
                ? 'bg-yellow-500/15 text-yellow-400'
                : 'bg-gold-500/15 text-gold-400'
              : 'bg-navy-700/50 text-slate-400'
          }`}
        >
          {formatTime(time)}
        </div>
      )}
    </div>
  );
}
