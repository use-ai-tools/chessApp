import React, { useState } from 'react';

export default function MatchOptions({
  onResign,
  onDrawOffer,
  onEmojiReaction,
  onToggleSound,
  onFlipBoard,
  onOpenSettings,
  soundEnabled,
  drawOfferPending,
  gameStatus,
  onGameReview,
}) {
  const [confirmResign, setConfirmResign] = useState(false);

  const isPlaying = gameStatus === 'playing';
  const isFinished = gameStatus === 'finished';

  const handleResign = () => {
    if (!confirmResign) { setConfirmResign(true); return; }
    onResign();
    setConfirmResign(false);
  };

  return (
    <div className="space-y-2">
      {/* ── Bottom Toolbar — 3 buttons (chess.com style) ── */}
      {isPlaying && (
        <div className="card p-2">
          <div className="flex items-center gap-2">
            {/* Resign */}
            <button
              onClick={handleResign}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                confirmResign
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-navy-800 border border-navy-700/30 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
              }`}
            >
              <span>🏳️</span>
              {confirmResign ? 'Confirm?' : 'Resign'}
            </button>

            {/* Draw Offer */}
            <button
              onClick={onDrawOffer}
              disabled={drawOfferPending}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                drawOfferPending
                  ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400 opacity-60 cursor-not-allowed'
                  : 'bg-navy-800 border border-navy-700/30 text-slate-300 hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30'
              }`}
            >
              <span>🤝</span>
              {drawOfferPending ? 'Sent...' : 'Draw'}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-navy-800 border border-navy-700/30 text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span>⚙️</span>
              Settings
            </button>
          </div>

          {/* Resign confirmation overlay */}
          {confirmResign && (
            <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-scale-in">
              <p className="text-xs text-red-400 mb-2 text-center">Your opponent wins and gets the prize</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmResign(false)}
                  className="flex-1 py-2 rounded-lg bg-navy-700 text-slate-300 text-xs font-medium hover:bg-navy-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResign}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-all"
                >
                  Yes, Resign
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick action buttons */}
      <div className="flex items-center justify-center gap-1">
        <button onClick={onFlipBoard} className="toolbar-btn" title="Flip Board">
          <span className="text-lg">🔄</span>
          <span className="text-[10px]">Flip</span>
        </button>

        <button onClick={onToggleSound} className="toolbar-btn" title="Toggle Sound">
          <span className="text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
          <span className="text-[10px]">Sound</span>
        </button>

        {isFinished && onGameReview && (
          <button
            onClick={onGameReview}
            className="toolbar-btn hover:text-purple-400"
            title="Game Review"
          >
            <span className="text-lg">📊</span>
            <span className="text-[10px]">Review</span>
          </button>
        )}
      </div>
    </div>
  );
}
