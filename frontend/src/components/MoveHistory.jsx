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
  mode, // 'horizontal' | 'vertical' | auto (based on screen)
}) {
  const activeRef = useRef(null);
  const containerRef = useRef(null);
  const hScrollRef = useRef(null);

  const activeIndex = currentIndex === -1 ? moves.length - 1 : currentIndex;

  // Auto-scroll within container only (vertical mode)
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const offsetTop = el.offsetTop - container.offsetTop;
      container.scrollTop = offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    }
  }, [activeIndex, moves.length]);

  // Auto-scroll horizontal mode
  useEffect(() => {
    if (hScrollRef.current) {
      hScrollRef.current.scrollLeft = hScrollRef.current.scrollWidth;
    }
  }, [moves.length]);

  // Navigation handlers
  const goFirst = () => onClickMove(0);
  const goPrev = () => {
    const idx = currentIndex === -1 ? moves.length - 1 : currentIndex;
    if (idx > 0) onClickMove(idx - 1);
  };
  const goNext = () => {
    const idx = currentIndex === -1 ? moves.length - 1 : currentIndex;
    if (idx < moves.length - 1) onClickMove(idx + 1);
    else onClickMove(-1);
  };
  const goLast = () => onClickMove(-1);

  if (!moves || moves.length === 0) {
    return (
      <div className="bg-navy-800/60 border border-navy-700/50 p-2">
        <p className="text-[10px] text-slate-600 text-center py-1">No moves yet</p>
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
    <>
      {/* ── MOBILE: Horizontal scroll bar ── */}
      <div className={`${mode === 'vertical' ? 'hidden' : mode === 'horizontal' ? '' : 'lg:hidden'}`}>
        <div className="bg-navy-800/60 border border-navy-700/50 p-1.5">
          <div ref={hScrollRef} className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1" style={{ scrollbarWidth: 'thin' }}>
            {moves.map((san, i) => {
              const cls = classifications?.[i];
              const cfg = cls?.classification ? CLASS_CONFIG[cls.classification] : null;
              const showBadge = cfg && cls.classification !== 'good';
              const isActive = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => onClickMove(i)}
                  className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-chess-green/20 text-white font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {i % 2 === 0 && <span className="text-slate-600 mr-0.5">{Math.floor(i / 2) + 1}.</span>}
                  {san}
                  {showBadge && <span className={`ml-0.5 text-[8px] font-black ${cfg.color}`}>{cfg.icon}</span>}
                </button>
              );
            })}
          </div>
          {/* Nav buttons */}
          <div className="flex items-center justify-center gap-1 pt-1 border-t border-navy-800/30 mt-1">
            <button onClick={goFirst} className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-white transition-colors" title="First">⏮</button>
            <button onClick={goPrev} className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-white transition-colors" title="Prev">◀</button>
            <button onClick={goNext} className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-white transition-colors" title="Next">▶</button>
            <button onClick={goLast} className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-white transition-colors" title="Live">⏭</button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: Vertical scrollable panel ── */}
      <div className={`${mode === 'horizontal' ? 'hidden' : mode === 'vertical' ? '' : 'hidden lg:block'}`}>
        <div className="bg-navy-800/60 border border-navy-700/50 p-2 flex flex-col">
          <div className="flex items-center justify-between mb-1 px-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Moves</h4>
            <span className="text-[9px] text-slate-600">{moves.length}</span>
          </div>

          <div ref={containerRef} className="overflow-y-auto overflow-x-hidden pr-1" style={{ maxHeight: '360px', scrollbarWidth: 'thin' }}>
            {pairs.map((pair) => (
              <div
                key={pair.number}
                className="flex items-center gap-0 text-xs border-b border-navy-800/30 last:border-0"
              >
                <span className="text-slate-600 font-bold w-6 text-right pr-1 flex-shrink-0 text-[10px]">{pair.number}.</span>
                <MoveCell
                  san={pair.white.san}
                  cls={pair.white.cls}
                  isActive={pair.white.index === activeIndex}
                  onClick={() => onClickMove(pair.white.index)}
                  ref={pair.white.index === activeIndex ? activeRef : null}
                />
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

          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-1 pt-1.5 mt-1 border-t border-navy-800/30">
            <button onClick={goFirst} className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors rounded" title="First move">⏮</button>
            <button onClick={goPrev} className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors rounded" title="Previous move">◀</button>
            <button onClick={goNext} className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors rounded" title="Next move">▶</button>
            <button onClick={goLast} className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors rounded" title="Latest move">⏭</button>
          </div>
        </div>
      </div>
    </>
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
