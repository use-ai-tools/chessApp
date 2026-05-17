import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navLinks = [
    { to: '/play', label: 'Play', icon: '♟️' },
    { to: '/puzzles', label: 'Puzzles', icon: '🧩' },
    { to: '/learn', label: 'Learn', icon: '🎓' },
    { to: '/watch', label: 'Watch', icon: '📺' },
    { to: '/community', label: 'Community', icon: '👥' },
  ];

  const isActive = (path) => {
    if (path === '/play' && (location.pathname === '/' || location.pathname.startsWith('/room') || location.pathname === '/play')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-navy-900/90 backdrop-blur-md border-r border-navy-800/30 sticky top-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chess-green to-emerald-600 flex items-center justify-center shadow-md shadow-chess-green/20 group-hover:shadow-chess-green/40 transition-all">
            <span className="text-white font-black text-xl">♔</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">Chess</span>
            <span className="text-chess-green">Arena</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold group ${
                active
                  ? 'bg-gradient-to-r from-chess-green/15 to-chess-green/5 text-chess-green'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 rounded-r-full bg-chess-green shadow-[0_0_8px_rgba(129,182,76,0.6)]" />
              )}
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-navy-800/30">
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
            location.pathname === '/profile' ? 'bg-white/[0.04] text-white' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
          }`}
        >
          <span className="text-lg">👤</span>
          <span className="text-sm">Profile</span>
        </Link>
      </div>
    </aside>
  );
}
