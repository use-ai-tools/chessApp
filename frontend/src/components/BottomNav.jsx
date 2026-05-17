import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/contests', label: 'Contests', icon: '⚔️' },
  { path: '/learn', label: 'Learn', icon: '🎓' },
  { path: '/tournaments', label: 'Tourneys', icon: '🏆' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 backdrop-blur-xl border-t border-navy-800/40 safe-area-bottom md:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[48px] rounded-xl transition-all ${
                active ? 'text-chess-green' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-chess-green' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-chess-green shadow-[0_0_6px_rgba(129,182,76,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
