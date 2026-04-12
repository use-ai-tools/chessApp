import React, { useState } from 'react';

const DEFAULTS = {
  boardTheme: 'classic',
  premoves: true,
  moveSound: true,
  autoQueen: true,
  moveConfirmation: false,
  lowTimeSound: true,
  lowTimeHaptic: true,
  showLegalMoves: true,
  showLastMove: true,
  animationSpeed: 'normal',
};

export default function MatchSettings({ onClose, onApply }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('chess-settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  });

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    localStorage.setItem('chess-settings', JSON.stringify(settings));
    onApply(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
  };

  const themes = [
    { key: 'classic', label: 'Classic', light: '#f0d9b5', dark: '#b58863' },
    { key: 'dark', label: 'Dark', light: '#334155', dark: '#1e293b' },
    { key: 'green', label: 'Green', light: '#eeeed2', dark: '#769656' },
    { key: 'ocean', label: 'Ocean', light: '#b8cce2', dark: '#5b7ea4' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">⚙️ Settings</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-4">
            {/* Board Theme */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">Board Theme</label>
              <div className="flex gap-2">
                {themes.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => update('boardTheme', t.key)}
                    className={`flex-1 p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      settings.boardTheme === t.key
                        ? 'border-chess-green bg-chess-green/5'
                        : 'border-navy-700/30 hover:border-navy-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex">
                      <div className="w-1/2 h-full" style={{ backgroundColor: t.light }} />
                      <div className="w-1/2 h-full" style={{ backgroundColor: t.dark }} />
                    </div>
                    <span className="text-[10px] text-slate-400">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gameplay Toggles */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-wider">Gameplay</label>
              <div className="space-y-3">
                <ToggleRow label="Premoves" desc="Queue a move during opponent's turn" value={settings.premoves} onChange={(v) => update('premoves', v)} />
                <ToggleRow label="Move Sound" desc="Play sound on piece movement" value={settings.moveSound} onChange={(v) => update('moveSound', v)} />
                <ToggleRow label="Auto-Queen" desc="Auto promote pawn to queen" value={settings.autoQueen} onChange={(v) => update('autoQueen', v)} />
                <ToggleRow label="Confirm Each Move" desc="Tap to select, tap again to confirm" value={settings.moveConfirmation} onChange={(v) => update('moveConfirmation', v)} />
              </div>
            </div>

            {/* Time Warnings */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-wider">Low Time Alerts</label>
              <div className="space-y-3">
                <ToggleRow label="Low-Time Sound Warning" desc="Audible alert when time is low" value={settings.lowTimeSound} onChange={(v) => update('lowTimeSound', v)} />
                <ToggleRow label="Low-Time Haptic Feedback" desc="Vibration alert when time is low" value={settings.lowTimeHaptic} onChange={(v) => update('lowTimeHaptic', v)} />
              </div>
            </div>

            {/* Display */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-wider">Display</label>
              <div className="space-y-3">
                <ToggleRow label="Show Legal Moves" value={settings.showLegalMoves} onChange={(v) => update('showLegalMoves', v)} />
                <ToggleRow label="Show Last Move" value={settings.showLastMove} onChange={(v) => update('showLastMove', v)} />
              </div>
            </div>

            {/* Animation Speed */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">Animation Speed</label>
              <div className="flex gap-1">
                {['none', 'fast', 'normal'].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => update('animationSpeed', speed)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      settings.animationSpeed === speed
                        ? 'bg-chess-green/15 text-chess-green border border-chess-green/30'
                        : 'bg-navy-800 text-slate-400 border border-navy-700/30 hover:text-white'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-navy-700/30">
            <button onClick={handleReset} className="btn-ghost btn-sm text-slate-500">Reset</button>
            <div className="flex-1" />
            <button onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={handleApply} className="btn-primary btn-sm">Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange, desc }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {desc && <p className="text-[10px] text-slate-500">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-chess-green' : 'bg-navy-600'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
