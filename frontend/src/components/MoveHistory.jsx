import React, { useRef, useEffect } from 'react';

const CLASS_CONFIG = {
  brilliant:   { icon: '‼', color: 'text-cyan-400' },
  best:        { icon: '★', color: 'text-emerald-400' },
  excellent:   { icon: '★', color: 'text-green-400' },
  good:        { icon: '●', color: 'text-slate-500' },
  inaccuracy:  { icon: '?!', color: 'text-yellow-400' },
  mistake:     { icon: '?', color: 'text-orange-400' },
  blunder:     { icon: '??', color: 'text-red-400' },
};

export default function MoveHistory({
  moves,
  currentIndex,
  onClickMove,
  classifications,
}) {
  const activeRef = useRef(null);
  const containerRef = useRef(null);

  const activeIndex = currentIndex === -1 ? moves.length - 1 : currentIndex;

  // Auto-scroll to keep active move visible
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex, moves.length]);

  if (!moves || moves.length === 0) {
    return (
      <div className="card p-3 h-full flex flex-col">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Moves</h4>
        <p className="text-xs text-slate-600 text-center py-4">No moves yet</p>
      </div>
    );
  }

  // Group moves into pairs
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: { san: moves[i], index: i, cls: classifications?.[i] },
      black: i + 1 < moves.length ? { san: moves[i + 1], index: i + 1, cls: classifications?.[i + 1] } : null,
    });
  }

  return (
    <div className="card p-2 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1 px-1">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Moves</h4>
        <span className="text-[9px] text-slate-600">{moves.length}</span>
      </div>

      {/* Vertical scrolling move list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin pr-1">
        {pairs.map((pair) => (
          <div
            key={pair.number}
            className="flex items-center gap-0 text-xs border-b border-navy-800/30 last:border-0"
          >
            {/* Move number */}
            <span className="text-slate-600 font-bold w-6 text-right pr-1 flex-shrink-0 text-[10px]">{pair.number}.</span>
            {/* White move */}
            <MoveCell
              san={pair.white.san}
              cls={pair.white.cls}
              isActive={pair.white.index === activeIndex}
              onClick={() => onClickMove(pair.white.index)}
              ref={pair.white.index === activeIndex ? activeRef : null}
            />
            {/* Black move */}
            {pair.black ? (
              <MoveCell
                san={pair.black.san}
                cls={pair.black.cls}
                isActive={pair.black.index === activeIndex}
                onClick={() => onClickMove(pair.black.index)}
                ref={pair.black.index === activeIndex ? activeRef : null}
              />
            ) : (
              <div className="flex-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const MoveCell = React.forwardRef(({ san, cls, isActive, onClick }, ref) => {
  const classification = cls?.classification;
  const cfg = classification ? CLASS_CONFIG[classification] : null;
  const showBadge = cfg && classification !== 'good';

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`flex-1 text-left px-2 py-1.5 text-xs transition-colors flex items-center gap-1 ${
        isActive
          ? 'bg-chess-green/20 text-white font-bold'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {san}
      {showBadge && (
        <span className={`text-[9px] font-black ${cfg.color}`}>{cfg.icon}</span>
      )}
    </button>
  );
});
