import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const PIECES = ['♔', '♕', '♖', '♗', '♘', '♙'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data.user);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading Profile...</div>;
  if (!profile) return null;

  const stats = profile.paidStats || {};
  const winRate = stats.totalMatches ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-navy-800/50 border border-navy-700/50 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-4xl text-white shadow-xl shadow-purple-500/20">
          {profile.avatar || '♔'}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            {profile.username}
            {profile.unverified && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">Unverified</span>}
          </h1>
          <p className="text-slate-400 mt-1">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="bg-navy-900/50 rounded-xl px-6 py-4 border border-navy-700/50 text-center">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Free Rating</p>
          <p className="text-3xl font-black text-white">{profile.elo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-navy-800/50 border border-navy-700/50 p-6 rounded-2xl">
          <h3 className="text-slate-400 font-medium mb-4">Paid Matches</h3>
          <div className="text-3xl font-black text-white">{stats.totalMatches || 0}</div>
        </div>
        <div className="bg-navy-800/50 border border-navy-700/50 p-6 rounded-2xl">
          <h3 className="text-slate-400 font-medium mb-4">Win Rate</h3>
          <div className="text-3xl font-black text-emerald-400">{winRate}%</div>
        </div>
        <div className="bg-navy-800/50 border border-navy-700/50 p-6 rounded-2xl">
          <h3 className="text-slate-400 font-medium mb-4">Best Win Streak</h3>
          <div className="text-3xl font-black text-orange-400 flex items-center gap-2">
            🔥 {stats.winStreak || 0}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
        <div className="flex flex-wrap gap-3">
          {(profile.achievements || []).length === 0 ? (
            <p className="text-slate-500">No achievements yet. Keep playing!</p>
          ) : (
            profile.achievements.map((ach, i) => (
              <div key={i} className="bg-chess-green/10 text-chess-green border border-chess-green/20 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                🏆 {ach}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Recent Form (Paid Matches)</h2>
        <div className="flex gap-2">
          {(stats.recentResults || []).length === 0 ? (
            <p className="text-slate-500">No recent matches.</p>
          ) : (
            stats.recentResults.map((r, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${r.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' : r.result === 'L' ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/20 text-slate-400'}`}>
                {r.result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
