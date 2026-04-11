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
  gameStatus, // 'playing' | 'finished' | etc.
  onGameReview, // callback to open game review — only active after game ends
}) {
  const [confirmResign, setConfirmResign] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isPlaying = gameStatus === 'playing';

  const handleResign = () => {
    if (!confirmResign) { setConfirmResign(true); return; }
    onResign();
    setConfirmResign(false);
    setShowMenu(false);
  };

  return (
    <div className="card p-3 space-y-1">
      {/* ── Bottom Toolbar (chess.com style) ── */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {/* Options Menu Toggle */}
        <button 
          onClick={() => { setShowMenu(!showMenu); setShowEmojis(false); }}
          className={`toolbar-btn ${showMenu ? 'toolbar-btn-active' : ''}`}
          title="Options"
        >
          <span className="text-lg">≡</span>
          <span className="text-[10px]">Options</span>
        </button>

        {/* Emoji Toggle */}
        {isPlaying && (
          <button 
            onClick={() => { setShowEmojis(!showEmojis); setShowMenu(false); }}
            className={`toolbar-btn ${showEmojis ? 'toolbar-btn-active' : ''}`}
            title="React"
          >
            <span className="text-lg">😊</span>
            <span className="text-[10px]">React</span>
          </button>
        )}

        {/* Flip Board */}
        <button onClick={onFlipBoard} className="toolbar-btn" title="Flip Board">
          <span className="text-lg">🔄</span>
          <span className="text-[10px]">Flip</span>
        </button>

        {/* Sound Toggle */}
        <button onClick={onToggleSound} className="toolbar-btn" title="Toggle Sound">
          <span className="text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
          <span className="text-[10px]">Sound</span>
        </button>

        {/* Analysis / Game Review */}
        <button 
          onClick={onGameReview}
          disabled={isPlaying}
          className={`toolbar-btn ${isPlaying ? 'opacity-30 cursor-not-allowed' : 'hover:text-purple-400'}`}
          title={isPlaying ? 'Analysis available after game ends' : 'Game Review'}
        >
          <span className="text-lg">📊</span>
          <span className="text-[10px]">{isPlaying ? 'Locked' : 'Review'}</span>
        </button>
      </div>

      {/* ── Emoji Panel ── */}
      {showEmojis && (
        <div className="bg-navy-800/80 border border-navy-700/50 rounded-xl p-2.5 flex gap-1.5 justify-center animate-scale-in">
          {EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => { onEmojiReaction(emoji); setShowEmojis(false); }}
              className="text-2xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-white/10 active:scale-95">{emoji}</button>
          ))}
        </div>
      )}

      {/* ── Options Menu ── */}
      {showMenu && (
        <div className="space-y-1 animate-slide-down">
          {/* Resign */}
          {isPlaying && (
            <>
              {confirmResign ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 animate-scale-in">
                  <p className="text-xs text-red-400 flex-1">Are you sure you want to resign?</p>
                  <button onClick={handleResign} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-all">Yes, Resign</button>
                  <button onClick={() => setConfirmResign(false)} className="px-3 py-1.5 bg-navy-700 text-slate-300 text-xs font-medium rounded-lg hover:bg-navy-600 transition-all">Cancel</button>
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
            </>
          )}

          {/* Settings */}
          {onOpenSettings && (
            <button onClick={() => { onOpenSettings(); setShowMenu(false); }} className="match-option-btn">
              <span>⚙️</span> Settings
            </button>
          )}

          {/* Analysis info during game */}
          {isPlaying && (
            <div className="p-2.5 rounded-xl bg-navy-800/50 border border-navy-700/20">
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span>🔒</span> Analysis available after game ends
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
