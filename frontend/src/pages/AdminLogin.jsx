import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.username === 'kabir' || user.isAdmin || user.role === 'admin') {
          navigate('/admin/panel');
        }
      }
    } catch (err) {
      console.error('Error evaluating admin status:', err);
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Not an admin account');
      }

      // Store admin token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Force page reload to pick up new auth state
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-500/30">
            <span className="text-white text-3xl font-black">⚙</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            Admin <span className="text-gradient-gold">Portal</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Restricted access — administrators only</p>
        </div>

        {/* Login Card */}
        <div className="card animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-slide-down">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                '🔐 Admin Login'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-navy-700/30 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to Player Login
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          This portal is for authorized administrators only.
        </p>
      </div>
    </div>
  );
}
