import React, { useEffect, useState } from 'react';
import { playSound } from './ChessBoard';

const CLASS_CONFIG = {
  brilliant: { color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  best:      { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  excellent: { color: 'text-green-400', bg: 'bg-green-500/15' },
  good:      { color: 'text-slate-400', bg: 'bg-slate-500/15' },
  inaccuracy:{ color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  mistake:   { color: 'text-orange-400', bg: 'bg-orange-500/15' },
  blunder:   { color: 'text-red-400', bg: 'bg-red-500/15' },
};

export default function ResultModal({ result, onClose, onBackToLobby, onPlayAgain, onGameReview }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (result) {
      playSound('gameEnd');
      setTimeout(() => setShowContent(true), 300);
    }
  }, [result]);

  if (!result) return null;

  const isWinner = result.isWinner;
  const isDraw = result.isDraw || result.reason === 'draw' || result.reason === 'stalemate';
  const isCheckmate = result.reason === 'checkmate';
  const review = result.review;
  const mySummary = result.playerColor === 'w' ? review?.white : review?.black;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          {/* King fall animation for checkmate */}
          {isCheckmate && !isWinner && (
            <div className="king-fall mb-4">
              <span className="text-6xl">♚</span>
            </div>
          )}
          {isCheckmate && isWinner && (
            <div className="king-fall-opponent mb-4">
              <span className="text-6xl">♚</span>
            </div>
          )}

          {/* Icon */}
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 animate-bounce-in ${
            isWinner ? 'bg-gradient-to-br from-chess-green to-emerald-600 shadow-lg shadow-chess-green/30'
            : isDraw ? 'bg-gradient-to-br from-slate-500 to-slate-600'
            : 'bg-gradient-to-br from-slate-700 to-slate-800'
          }`}>
            <span className="text-4xl">{isWinner ? '🏆' : isDraw ? '🤝' : '😔'}</span>
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-black mb-1 ${
            isWinner ? 'text-chess-green' : isDraw ? 'text-slate-300' : 'text-slate-400'
          }`}>
            {isWinner ? 'You Won!' : isDraw ? 'Draw!' : 'You Lost!'}
          </h2>

          <p className="text-slate-400 text-sm mb-3">
            {result.reason === 'checkmate' && (isWinner ? 'by Checkmate' : 'by Checkmate')}
            {result.reason === 'timeout' && (isWinner ? 'Opponent ran out of time' : 'by Timeout')}
            {result.reason === 'resigned' && (isWinner ? 'Opponent resigned' : 'You resigned')}
            {result.reason === 'stalemate' && 'Stalemate'}
            {result.reason === 'draw' && 'Draw by agreement'}
            {result.reason === 'repetition' && 'Draw by repetition'}
            {result.reason === 'insufficient' && 'Draw — insufficient material'}
            {result.reason === 'disconnect' && (isWinner ? 'Opponent disconnected' : 'You disconnected')}
          </p>

          {/* AI Coach Comment */}
          {result.coachComment && (
            <div className="mb-3 p-3 rounded-xl bg-navy-800/50 border border-navy-700/30 text-left">
              <p className="text-xs text-slate-500 mb-1">🤖 AI Coach</p>
              <p className="text-sm text-slate-300 italic">"{result.coachComment}"</p>
            </div>
          )}

          {/* Move Quality Summary */}
          {mySummary && (
            <div className="mb-3">
              <div className="flex justify-center gap-1.5 flex-wrap">
                {Object.entries(CLASS_CONFIG).map(([key, cfg]) => {
                  const count = mySummary[key] || 0;
                  if (count === 0 && ['excellent', 'good'].includes(key)) return null;
                  return (
                    <div key={key} className={`px-2 py-1 rounded-lg ${cfg.bg} flex items-center gap-1`}>
                      <span className={`text-xs font-black ${cfg.color}`}>{count}</span>
                      <span className="text-[9px] text-slate-400 capitalize">{key.slice(0, 4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ELO Change */}
          {result.eloChange !== null && result.eloChange !== undefined && (
            <div className={`mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
              result.eloChange > 0 ? 'bg-emerald-500/10 border border-emerald-500/20'
              : result.eloChange < 0 ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-slate-500/10 border border-slate-500/20'
            }`}>
              <span className={`text-lg font-black ${
                result.eloChange > 0 ? 'text-emerald-400' : result.eloChange < 0 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {result.eloChange > 0 ? `+${result.eloChange}` : result.eloChange} ELO
              </span>
              <span className="text-lg">{result.eloChange > 0 ? '⬆' : result.eloChange < 0 ? '⬇' : '━'}</span>
              {result.newElo && <span className="text-xs text-slate-500">Now {result.newElo}</span>}
            </div>
          )}

          {/* Prize Won */}
          {result.prize > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 glow-gold">
              <p className="text-sm text-gold-400 mb-1">🏆 Prize Won</p>
              <p className="text-2xl font-black text-gold-300">+₹{result.prize.toLocaleString()}</p>
              <p className="text-xs text-gold-500 mt-1">Added to your wallet</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 mt-4">
            {/* FEATURE 4: Game Review button — always shown after match if review data exists */}
            {onGameReview && (
              <button onClick={onGameReview} className="w-full py-2.5 rounded-xl bg-purple-600/15 border border-purple-500/20 text-purple-400 text-sm font-bold hover:bg-purple-600/25 transition-all flex items-center justify-center gap-2">
                <span>📊</span> Game Review
              </button>
            )}
            <div className="flex gap-2">
              {onPlayAgain && (
                <button onClick={onPlayAgain} className="btn-primary flex-1">
                  ⚡ Play Again
                </button>
              )}
              <button onClick={onBackToLobby} className="btn-secondary flex-1">
                ← Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
