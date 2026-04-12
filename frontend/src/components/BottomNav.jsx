import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/contests', label: 'Contests', icon: '⚔️' },
  { path: '/transactions', label: 'History', icon: '📋' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const location = useLocation();

  // Map /contests to / since lobby IS the contests page
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-xl border-t border-navy-700/50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? currentPath === '/' || currentPath === '/contests'
              : currentPath === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? 'text-chess-green'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-wide ${
                isActive ? 'text-chess-green' : 'text-slate-500'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-chess-green mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
