import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/contests', label: 'Contests', icon: '⚔️' },
  { path: '/tournaments', label: 'Tourneys', icon: '🏆' },
  { path: '/transactions', label: 'History', icon: '📋' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 backdrop-blur-md safe-area-bottom md:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                active
                  ? 'text-chess-green'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <span className={`text-xl ${active ? '' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-semibold tracking-wide ${
                active ? 'text-chess-green' : 'text-slate-600'
              }`}>
                {tab.label}
              </span>
              {active && (
                <div className="w-4 h-0.5 rounded-full bg-chess-green" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
