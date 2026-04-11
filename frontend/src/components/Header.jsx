import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import WalletModal from './WalletModal';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [walletOpen, setWalletOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const navLinks = [
    { to: '/', label: 'Lobby', icon: '🏟️' },
    { to: '/tournaments', label: 'Tournaments', icon: '🏆' },
    { to: '/referrals', label: 'Refer & Earn', icon: '🤝' },
    { to: '/leaderboard', label: 'Rankings', icon: '🏅' },
    { to: '/transactions', label: 'History', icon: '📋' },
    ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-navy-700/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chess-green to-emerald-600 flex items-center justify-center shadow-lg shadow-chess-green/20 group-hover:shadow-chess-green/40 transition-shadow">
              <span className="text-white font-black text-lg">♔</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden sm:block">
              <span className="text-white">Chess</span>
              <span className="text-gradient-green">Arena</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-chess-green/15 text-chess-green border border-chess-green/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Wallet Button */}
            <button
              onClick={() => setWalletOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-chess-green/10 to-emerald-600/10 border border-chess-green/20 hover:border-chess-green/40 transition-all group"
              id="wallet-btn"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-chess-green to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">₹</span>
              </div>
              <span className="text-chess-green font-bold text-sm group-hover:text-emerald-400 transition-colors">
                {(user.wallet || 0).toLocaleString()}
              </span>
            </button>

            {/* Notification Bell */}
            <Link to="/profile" className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Pulse Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* User Avatar */}
            <Link to="/profile" className="hidden sm:flex items-center gap-2 hover:bg-white/5 p-1 px-2 rounded-xl transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center ring-2 ring-purple-500/20">
                <span className="text-white text-xs font-bold">
                  {user.avatar || user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-300 max-w-[100px] truncate">
                {user.username}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              className="hidden sm:flex btn-ghost btn-sm text-slate-500 hover:text-red-400"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-navy-700/50 bg-navy-900/95 backdrop-blur-xl animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-chess-green/15 text-chess-green'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-navy-700/50">
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Wallet Modal */}
      {walletOpen && <WalletModal onClose={() => setWalletOpen(false)} />}
    </>
  );
}
