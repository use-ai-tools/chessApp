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
    <aside className="hidden md:flex flex-col w-64 h-full bg-navy-900 border-r border-navy-800">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chess-green to-emerald-600 flex items-center justify-center shadow-lg shadow-chess-green/20 group-hover:shadow-chess-green/40 transition-shadow">
            <span className="text-white font-black text-xl">♔</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-white">Chess</span>
            <span className="text-chess-green">Arena</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${
              isActive(link.to)
                ? 'bg-chess-green/15 text-chess-green shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-navy-800">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-bold"
        >
          <span className="text-xl">👤</span>
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  );
}
