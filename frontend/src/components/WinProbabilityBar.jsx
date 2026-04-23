import React, { useMemo } from 'react';
import { Chess } from 'chess.js';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/**
 * WinProbabilityBar — shows advantage as a vertical bar (white bottom, black top).
 *
 * Props:
 *  - evalScore (number, centipawns from white's perspective) — Stockfish eval
 *  - evalType ('cp' | 'mate') — type of eval
 *  - fen (string) — fallback: if no evalScore, compute from material
 *  - height (number|string) — bar height
 */
export default function WinProbabilityBar({ evalScore, evalType, fen, height = 300 }) {
  const { whitePercent, displayText } = useMemo(() => {
    // ── If Stockfish eval is provided, use it ──
    if (evalScore !== undefined && evalScore !== null) {
      if (evalType === 'mate') {
        // Mate score: positive = white mates, negative = black mates
        const mating = evalScore > 0;
        return {
          whitePercent: mating ? 97 : 3,
          displayText: `M${Math.abs(evalScore)}`,
        };
      }

      // Centipawn eval → normalize to percentage
      // Clamp to [-1000, 1000] range
      const clamped = Math.max(-1000, Math.min(1000, evalScore));
      // Convert: -1000 → 5%, 0 → 50%, +1000 → 95%
      const pct = Math.max(5, Math.min(95, ((clamped + 1000) / 2000) * 100));
      const adv = Math.abs(evalScore / 100).toFixed(1);
      const sign = evalScore > 0 ? '+' : evalScore < 0 ? '-' : '';
      return {
        whitePercent: pct,
        displayText: evalScore !== 0 ? `${sign}${adv}` : '0.0',
      };
    }

    // ── Fallback: material counting from FEN ──
    if (!fen) return { whitePercent: 50, displayText: '' };

    try {
      const chess = new Chess(fen);
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'b' ? 'w' : 'b';
        return {
          whitePercent: winner === 'w' ? 100 : 0,
          displayText: winner === 'w' ? '1-0' : '0-1',
        };
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
    const pct = Math.min(95, Math.max(5, 50 + (diff / 39) * 50 * 2));
    const adv = Math.abs(diff);
    return {
      whitePercent: pct,
      displayText: diff !== 0 ? (diff > 0 ? `+${adv}` : `-${adv}`) : '',
    };
  }, [evalScore, evalType, fen]);

  const blackPercent = 100 - whitePercent;
  const isWhiteAhead = whitePercent > 50;

  return (
    <div className="flex flex-col items-center gap-1" style={{ height, minWidth: 22 }}>
      {/* Black advantage text (top) */}
      <span className={`text-[10px] font-bold transition-opacity duration-300 ${
        !isWhiteAhead && displayText ? 'text-slate-300' : 'text-transparent'
      }`}>
        {!isWhiteAhead ? displayText : '\u00A0'}
      </span>

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

      {/* White advantage text (bottom) */}
      <span className={`text-[10px] font-bold transition-opacity duration-300 ${
        isWhiteAhead && displayText ? 'text-slate-300' : 'text-transparent'
      }`}>
        {isWhiteAhead ? displayText : '\u00A0'}
      </span>
    </div>
  );
}
