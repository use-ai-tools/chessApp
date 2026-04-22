import React, { useMemo } from 'react';
import { Chess } from 'chess.js';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export default function WinProbabilityBar({ fen, height = 300 }) {
  const { whitePercent, advantage, isMate, winner } = useMemo(() => {
    if (!fen) return { whitePercent: 50, advantage: 0 };
    
    try {
      const chess = new Chess(fen);
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'b' ? 'w' : 'b';
        return { whitePercent: winner === 'w' ? 100 : 0, advantage: winner === 'w' ? 99 : -99, isMate: true, winner };
      }
    } catch(e) {}
    
    const boardPart = fen.split(' ')[0];
    let white = 0, black = 0;
    for (const ch of boardPart) {
      const lower = ch.toLowerCase();
      if (PIECE_VALUES[lower] !== undefined) {
        if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) white += PIECE_VALUES[lower];
        else if (ch === ch.toLowerCase() && ch !== ch.toUpperCase()) black += PIECE_VALUES[lower];
      }
    }

    const diff = white - black;
    // Convert to percentage: +9 = ~90%, -9 = ~10%
    const pct = Math.min(95, Math.max(5, 50 + (diff / 39) * 50 * 2));
    return { whitePercent: pct, advantage: diff };
  }, [fen]);

  const blackPercent = 100 - whitePercent;

  return (
    <div className="flex flex-col items-center gap-1" style={{ height }}>
      {/* Advantage text */}
      {advantage !== 0 && (
        <span className={`text-[10px] font-bold ${advantage > 0 ? 'text-slate-300' : 'text-slate-600'}`}>
          {advantage > 0 ? `+${advantage}` : ''}
        </span>
      )}

      {/* The bar */}
      <div className="w-5 flex-1 rounded-full overflow-hidden border border-navy-700/50 relative flex flex-col">
        {/* Black section (top) */}
        <div
          className="bg-gradient-to-b from-slate-800 to-slate-700 transition-all duration-700 ease-out"
          style={{ height: `${blackPercent}%` }}
        />
        {/* Divider line */}
        <div className="h-px bg-navy-600 w-full" />
        {/* White section (bottom) */}
        <div
          className="bg-gradient-to-b from-slate-200 to-white transition-all duration-700 ease-out flex-1"
        />
      </div>

      {/* Advantage text bottom */}
      {advantage !== 0 && (
        <span className={`text-[10px] font-bold ${advantage < 0 ? 'text-slate-300' : 'text-slate-600'}`}>
          {advantage < 0 ? `+${Math.abs(advantage)}` : ''}
        </span>
      )}
    </div>
  );
}
