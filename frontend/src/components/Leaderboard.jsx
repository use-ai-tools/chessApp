import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Leaderboard() {
  const { authFetch, user } = useContext(AuthContext);
  const [allTime, setAllTime] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [activeTab, setActiveTab] = useState('allTime');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const [allData, weeklyData] = await Promise.all([
        authFetch('/rooms/leaderboard'),
        authFetch('/rooms/leaderboard?period=weekly'),
      ]);
      setAllTime(allData.allTime || []);
      setWeekly(weeklyData.weekly || []);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const displayData = activeTab === 'allTime' ? allTime : weekly;

  const getEloTier = (elo) => {
    if (elo >= 1800) return { label: 'Master', color: 'text-red-400', bg: 'bg-red-500/15' };
    if (elo >= 1500) return { label: 'Expert', color: 'text-purple-400', bg: 'bg-purple-500/15' };
    if (elo >= 1200) return { label: 'Advanced', color: 'text-sky-400', bg: 'bg-sky-500/15' };
    if (elo >= 1000) return { label: 'Intermediate', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    return { label: 'Beginner', color: 'text-slate-400', bg: 'bg-slate-500/15' };
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-black text-white mb-2">
            Leader<span className="text-gradient-gold">board</span>
          </h1>
          <p className="text-slate-400 text-sm">Top players ranked by ELO rating</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-navy-800/50 rounded-xl p-1 mb-8 max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab('allTime')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'allTime'
                ? 'bg-gold-500/15 text-gold-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 All Time
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'weekly'
                ? 'bg-gold-500/15 text-gold-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📅 This Week
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 mx-auto border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🏅</div>
            <p className="text-slate-400">No rankings yet</p>
            <p className="text-slate-500 text-sm mt-1">Play matches to appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Podium (Top 3) */}
            {activeTab === 'allTime' && displayData.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-10 animate-slide-up">
                {/* 2nd place */}
                <PodiumCard player={displayData[1]} rank={2} currentUserId={user?.id} />
                {/* 1st place */}
                <PodiumCard player={displayData[0]} rank={1} currentUserId={user?.id} />
                {/* 3rd place */}
                <PodiumCard player={displayData[2]} rank={3} currentUserId={user?.id} />
              </div>
            )}

            {/* Full List */}
            <div className="card">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-500 border-b border-navy-700/30 mb-2">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-2 text-center">ELO</div>
                <div className="col-span-2 text-center">Wins</div>
                <div className="col-span-1 text-center">Played</div>
                <div className="col-span-2 text-right">
                  {activeTab === 'allTime' ? 'W/L' : 'Earned'}
                </div>
              </div>

              <div className="space-y-1">
                {displayData.map((entry, idx) => {
                  const p = activeTab === 'allTime' ? entry : entry.user;
                  const isCurrentUser = (p?._id || p?.id)?.toString() === user?.id;
                  const elo = p?.elo || 1000;
                  const tier = getEloTier(elo);

                  return (
                    <div
                      key={p?._id || idx}
                      className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl transition-all ${
                        isCurrentUser
                          ? 'bg-gold-500/5 border border-gold-500/10'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1">
                        <span
                          className={`text-sm font-bold ${
                            idx === 0
                              ? 'text-gold-400'
                              : idx === 1
                              ? 'text-slate-300'
                              : idx === 2
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Player */}
                      <div className="col-span-4 flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            idx === 0
                              ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900'
                              : idx === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-navy-900'
                              : idx === 2
                              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                              : 'bg-navy-700 text-slate-400'
                          }`}
                        >
                          {p?.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {p?.username || 'Unknown'}
                          </p>
                          {isCurrentUser && (
                            <p className="text-[10px] text-gold-400 font-bold">YOU</p>
                          )}
                        </div>
                      </div>

                      {/* ELO */}
                      <div className="col-span-2 text-center">
                        <span className={`text-sm font-bold ${tier.color}`}>
                          {elo}
                        </span>
                        <span className={`block text-[9px] font-medium ${tier.color} opacity-70`}>
                          {tier.label}
                        </span>
                      </div>

                      {/* Wins */}
                      <div className="col-span-2 text-center">
                        <span className="text-sm font-bold text-emerald-400">
                          {activeTab === 'allTime' ? p?.stats?.wins || 0 : entry.contestsWon || 0}
                        </span>
                      </div>

                      {/* Played */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm text-slate-400">
                          {activeTab === 'allTime' ? p?.stats?.gamesPlayed || 0 : '-'}
                        </span>
                      </div>

                      {/* W/L or Earnings */}
                      <div className="col-span-2 text-right">
                        {activeTab === 'allTime' ? (
                          <span className="text-xs text-slate-400">
                            {p?.stats?.wins || 0}/{p?.stats?.losses || 0}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-gold-400">
                            ₹{(entry.totalEarnings || 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ player, rank, currentUserId }) {
  const isCurrentUser = (player?._id || player?.id)?.toString() === currentUserId;
  const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const gradients = {
    1: 'from-gold-400 to-gold-600',
    2: 'from-slate-300 to-slate-500',
    3: 'from-amber-600 to-amber-800',
  };
  const elo = player?.elo || 1000;

  return (
    <div className="flex flex-col items-center" style={{ order: rank === 1 ? 0 : rank === 2 ? -1 : 1 }}>
      <div className="mb-2 text-2xl">{medals[rank]}</div>
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradients[rank]} flex items-center justify-center text-sm font-bold mb-2 ${
          rank === 1 ? 'text-navy-900 ring-2 ring-gold-400/30' : rank === 2 ? 'text-navy-900' : 'text-white'
        }`}
      >
        {player?.username?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <p className={`text-xs font-bold mb-0.5 ${isCurrentUser ? 'text-gold-400' : 'text-white'}`}>
        {player?.username || 'Unknown'}
      </p>
      <p className="text-[11px] font-bold text-gold-400 mb-1">{elo} ELO</p>
      <p className="text-[10px] text-slate-500 mb-2">
        {player?.stats?.wins || 0} wins
      </p>
      <div
        className={`w-20 ${heights[rank]} rounded-t-xl bg-gradient-to-t ${
          rank === 1
            ? 'from-gold-600/20 to-gold-500/5 border-x border-t border-gold-500/20'
            : rank === 2
            ? 'from-slate-600/20 to-slate-500/5 border-x border-t border-slate-500/20'
            : 'from-amber-700/20 to-amber-600/5 border-x border-t border-amber-600/20'
        } flex items-start justify-center pt-3`}
      >
        <span className={`text-lg font-black ${rank === 1 ? 'text-gold-400' : rank === 2 ? 'text-slate-400' : 'text-amber-500'}`}>
          #{rank}
        </span>
      </div>
    </div>
  );
}
