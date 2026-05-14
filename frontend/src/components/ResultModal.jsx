import React, { useEffect, useState } from 'react';
import { playSound } from './ChessBoard';
import { useCurrency } from '../contexts/CurrencyContext';

const CLASS_CONFIG = {
  brilliant: { icon: '‼', label: 'Brilliant', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  great:     { icon: '!', label: 'Great', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  best:      { icon: '★', label: 'Best', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  excellent: { icon: '★', label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/15' },
  good:      { icon: '●', label: 'Good', color: 'text-slate-400', bg: 'bg-slate-500/15' },
  inaccuracy:{ icon: '?!', label: 'Inaccuracy', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  mistake:   { icon: '?', label: 'Mistake', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  blunder:   { icon: '??', label: 'Blunder', color: 'text-red-400', bg: 'bg-red-500/15' },
};

export default function ResultModal({ result, onClose, onBackToLobby, onPlayAgain, onGameReview, isBotGame }) {
  const [phase, setPhase] = useState('reveal');  // 'reveal' -> 'actions'
  const [visible, setVisible] = useState(false);
  const { formatShort } = useCurrency();

  useEffect(() => {
    if (!result) return;
    playSound('gameEnd');

    // Phase 1: Fade in result text
    const t1 = setTimeout(() => setVisible(true), 100);
    // Phase 2: Show action buttons after delay
    const t2 = setTimeout(() => setPhase('actions'), 2500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [result]);

  if (!result) return null;

  const isWinner = result.isWinner;
  const isDraw = result.isDraw || result.reason === 'draw' || result.reason === 'stalemate';
  const review = result.review;
  const mySummary = result.playerColor === 'w' ? review?.white : review?.black;

  // Result display
  const getTitle = () => {
    if (isWinner) return 'You Won!';
    if (isDraw) return 'Draw';
    return 'You Lost';
  };
  const getIcon = () => {
    if (isWinner) return '👑';
    if (isDraw) return '🤝';
    return '♚';
  };
  const getReason = () => {
    const r = result.reason;
    if (r === 'checkmate') return isWinner ? 'by Checkmate' : 'Checkmate';
    if (r === 'timeout') return isWinner ? 'Opponent ran out of time' : 'Time expired';
    if (r === 'resigned') return isWinner ? 'Opponent resigned' : 'You resigned';
    if (r === 'stalemate') return 'Stalemate';
    if (r === 'draw') return 'Draw by agreement';
    if (r === 'repetition') return 'Threefold repetition';
    if (r === 'insufficient') return 'Insufficient material';
    if (r === 'disconnect') return isWinner ? 'Opponent disconnected' : 'Disconnected';
    return r || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={phase === 'actions' ? onClose : undefined}>
      {/* Semi-transparent backdrop — keeps board visible */}
      <div className={`absolute inset-0 transition-all duration-700 ${visible ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-transparent'}`} />

      {/* Content */}
      <div className={`relative z-10 max-w-sm w-full transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
           onClick={e => e.stopPropagation()}>

        {/* ── Phase 1: Result Reveal ── */}
        <div className="text-center mb-4">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all duration-700 ${
            isWinner ? 'bg-chess-green/20 shadow-lg shadow-chess-green/20'
            : isDraw ? 'bg-slate-500/20'
            : 'bg-red-500/10'
          } ${visible ? 'scale-100' : 'scale-50'}`}>
            <span className="text-4xl">{getIcon()}</span>
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-black mb-1 transition-all duration-500 ${
            isWinner ? 'text-chess-green' : isDraw ? 'text-slate-300' : 'text-red-400/80'
          }`}>
            {getTitle()}
          </h2>

          {/* Reason */}
          <p className="text-sm text-slate-400">{getReason()}</p>

          {/* Winner king / loser crossed king indicators */}
          {result.reason === 'checkmate' && (
            <div className="flex items-center justify-center gap-3 mt-2">
              {isWinner ? (
                <span className="text-xs text-chess-green/80 font-semibold">♔ Your King stands tall</span>
              ) : (
                <span className="text-xs text-red-400/70 font-semibold">♚ Your King has fallen</span>
              )}
            </div>
          )}

          {/* Bot badge */}
          {isBotGame && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-700/50 text-[10px] text-slate-400 font-semibold">
              🤖 vs Stockfish
            </div>
          )}
        </div>

        {/* ── Phase 2: Action Panel (fades in after delay) ── */}
        <div className={`transition-all duration-500 ${
          phase === 'actions' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}>
          <div className="bg-navy-800/90 backdrop-blur-md border border-navy-700/30 rounded-2xl p-5 shadow-2xl">

            {/* ELO Change */}
            {result.eloChange !== null && result.eloChange !== undefined && (
              <div className={`mb-3 flex items-center justify-center gap-2 py-2 rounded-xl ${
                result.eloChange > 0 ? 'bg-emerald-500/10' : result.eloChange < 0 ? 'bg-red-500/10' : 'bg-slate-500/10'
              }`}>
                <span className={`text-sm font-black ${
                  result.eloChange > 0 ? 'text-emerald-400' : result.eloChange < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {result.eloChange > 0 ? `+${result.eloChange}` : result.eloChange} ELO
                </span>
                {result.newElo && <span className="text-[10px] text-slate-500">→ {result.newElo}</span>}
              </div>
            )}

            {/* AI Coach */}
            {result.coachComment && (
              <div className="mb-3 p-3 rounded-xl bg-navy-900/50 border border-navy-700/20">
                <p className="text-[10px] text-slate-500 mb-0.5">🤖 AI Coach</p>
                <p className="text-xs text-slate-300 italic">"{result.coachComment}"</p>
              </div>
            )}

            {/* Move Quality (top 3) */}
            {mySummary && (
              <div className="mb-3 flex justify-center gap-1.5 flex-wrap">
                {Object.entries(CLASS_CONFIG).map(([key, cfg]) => ({
                  key, cfg, count: mySummary[key] || 0
                }))
                .filter(item => item.count > 0 && !['good'].includes(item.key))
                .slice(0, 3)
                .map(({ key, cfg, count }) => (
                  <div key={key} className={`px-2 py-1 rounded-lg ${cfg.bg} flex items-center gap-1`}>
                    <span className={`text-xs font-black ${cfg.color}`}>{count}</span>
                    <span className="text-[9px] text-slate-400 capitalize">{key.slice(0, 4)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Prize */}
            {result.prize > 0 && (
              <div className="mb-3 py-2 px-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-center">
                <p className="text-[10px] text-gold-500">🏆 Prize Won</p>
                <p className="text-lg font-black text-gold-300">+{formatShort(result.prize)}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {onGameReview && (
                <button onClick={onGameReview}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600/15 border border-purple-500/20 text-purple-400 hover:bg-purple-600/25 transition-all flex items-center justify-center gap-2">
                  📊 Game Review
                </button>
              )}
              <div className="flex gap-2">
                {onPlayAgain && (
                  <button onClick={onPlayAgain}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all">
                    ⚡ {isBotGame ? 'Play Again' : 'Rematch'}
                  </button>
                )}
                <button onClick={onBackToLobby}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
                  ← {isBotGame ? 'Home' : 'Lobby'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
