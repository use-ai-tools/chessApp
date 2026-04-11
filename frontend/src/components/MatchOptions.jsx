import React, { useState } from 'react';

const EMOJIS = ['👍', '😂', '😮', '😢', '😡', '🎉'];

export default function MatchOptions({
  onResign,
  onDrawOffer,
  onEmojiReaction,
  onToggleSound,
  onFlipBoard,
  onOpenSettings,
  soundEnabled,
  drawOfferPending,
}) {
  const [confirmResign, setConfirmResign] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const handleResign = () => {
    if (!confirmResign) { setConfirmResign(true); return; }
    onResign();
    setConfirmResign(false);
  };

  return (
    <div className="card p-3 space-y-1">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Match Options</h4>

      {/* Resign */}
      {confirmResign ? (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20 animate-scale-in">
          <p className="text-xs text-red-400 flex-1">Are you sure?</p>
          <button onClick={handleResign} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-all">Yes</button>
          <button onClick={() => setConfirmResign(false)} className="px-3 py-1.5 bg-navy-700 text-slate-300 text-xs font-medium rounded-lg hover:bg-navy-600 transition-all">No</button>
        </div>
      ) : (
        <button onClick={handleResign} className="match-option-btn hover:bg-red-500/10 hover:text-red-400">
          <span>🏳️</span> Resign
        </button>
      )}

      {/* Draw */}
      <button onClick={onDrawOffer} disabled={drawOfferPending}
        className={`match-option-btn ${drawOfferPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-500/10 hover:text-sky-400'}`}>
        <span>🤝</span> {drawOfferPending ? 'Draw Offered...' : 'Offer Draw'}
      </button>

      {/* Emoji */}
      <div className="relative">
        <button onClick={() => setShowEmojis(!showEmojis)} className="match-option-btn hover:bg-yellow-500/10 hover:text-yellow-400">
          <span>😊</span> React
        </button>
        {showEmojis && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-navy-800 border border-navy-700/50 rounded-xl p-2 flex gap-1 justify-center animate-scale-in z-20">
            {EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => { onEmojiReaction(emoji); setShowEmojis(false); }}
                className="text-2xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10">{emoji}</button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-navy-700/30 my-1" />

      {/* Sound */}
      <button onClick={onToggleSound} className="match-option-btn">
        <span>{soundEnabled ? '🔊' : '🔇'}</span> Sound {soundEnabled ? 'On' : 'Off'}
        <span className={`ml-auto w-8 h-4 rounded-full transition-all ${soundEnabled ? 'bg-chess-green' : 'bg-navy-600'} relative`}>
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${soundEnabled ? 'left-4' : 'left-0.5'}`} />
        </span>
      </button>

      {/* Flip */}
      <button onClick={onFlipBoard} className="match-option-btn"><span>🔄</span> Flip Board</button>

      {/* Settings */}
      {onOpenSettings && (
        <button onClick={onOpenSettings} className="match-option-btn"><span>⚙️</span> Settings</button>
      )}
    </div>
  );
}
