import React, { useRef, useEffect } from 'react';
import { Chess } from 'chess.js';

export default function MoveHistory({
  moves,         // array of SAN strings: ['e4', 'e5', 'Nf3', ...]
  currentIndex,  // which move is "active" (-1 = none, i.e. latest)
  onClickMove,   // (index) => void — click to preview that position
  startFen,      // starting FEN (default pos)
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to right when new moves arrive
  useEffect(() => {
    if (scrollRef.current && currentIndex === -1) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [moves.length, currentIndex]);

  if (!moves || moves.length === 0) {
    return (
      <div className="card p-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Moves</h4>
        <p className="text-xs text-slate-600 text-center py-4">No moves yet</p>
      </div>
    );
  }

  // Group moves into pairs for display
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: { san: moves[i], index: i },
      black: i + 1 < moves.length ? { san: moves[i + 1], index: i + 1 } : null,
    });
  }

  const activeIndex = currentIndex === -1 ? moves.length - 1 : currentIndex;

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moves</h4>
        <span className="text-[10px] text-slate-600">{moves.length} moves</span>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin snap-x">
        {pairs.map((pair) => (
          <div key={pair.number} className="flex items-center gap-1 flex-shrink-0 bg-navy-800/50 rounded px-2 py-1 snap-end">
            <span className="text-slate-500 text-xs font-bold">{pair.number}.</span>
            <button
              onClick={() => onClickMove(pair.white.index)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${pair.white.index === activeIndex ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              {pair.white.san}
            </button>
            {pair.black && (
              <button
                onClick={() => onClickMove(pair.black.index)}
                className={`text-xs px-1.5 py-0.5 rounded transition-colors ${pair.black.index === activeIndex ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              >
                {pair.black.san}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      {moves.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-navy-700/30">
          <NavBtn
            onClick={() => onClickMove(0)}
            disabled={activeIndex === 0}
            title="First move"
          >
            ⏮
          </NavBtn>
          <NavBtn
            onClick={() => onClickMove(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            title="Previous move"
          >
            ◀
          </NavBtn>
          <NavBtn
            onClick={() => onClickMove(Math.min(moves.length - 1, activeIndex + 1))}
            disabled={activeIndex >= moves.length - 1}
            title="Next move"
          >
            ▶
          </NavBtn>
          <NavBtn
            onClick={() => onClickMove(-1)}
            disabled={currentIndex === -1}
            title="Latest move"
          >
            ⏭
          </NavBtn>
        </div>
      )}
    </div>
  );
}

function NavBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
        disabled
          ? 'text-slate-600 cursor-not-allowed'
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
