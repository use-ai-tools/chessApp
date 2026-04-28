import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Tournament Prize Distribution ──
function getTournamentPrizes(prizePool, maxPlayers) {
  if (maxPlayers <= 50) {
    return [
      { rank: '1st', percent: 40, prize: Math.floor(prizePool * 0.40) },
      { rank: '2nd', percent: 25, prize: Math.floor(prizePool * 0.25) },
      { rank: '3rd', percent: 15, prize: Math.floor(prizePool * 0.15) },
      { rank: '4-5th', percent: 10, prize: Math.floor(prizePool * 0.10) },
      { rank: '6-10th', percent: 10, prize: Math.floor(prizePool * 0.10) },
    ];
  }
  if (maxPlayers <= 200) {
    return [
      { rank: '1st', percent: 30, prize: Math.floor(prizePool * 0.30) },
      { rank: '2nd', percent: 18, prize: Math.floor(prizePool * 0.18) },
      { rank: '3rd', percent: 12, prize: Math.floor(prizePool * 0.12) },
      { rank: '4-5th', percent: 10, prize: Math.floor(prizePool * 0.10) },
      { rank: '6-10th', percent: 10, prize: Math.floor(prizePool * 0.10) },
      { rank: '11-20th', percent: 10, prize: Math.floor(prizePool * 0.10) },
      { rank: '21-50th', percent: 10, prize: Math.floor(prizePool * 0.10) },
    ];
  }
  return [
    { rank: '1st', percent: 25, prize: Math.floor(prizePool * 0.25) },
    { rank: '2nd', percent: 15, prize: Math.floor(prizePool * 0.15) },
    { rank: '3rd', percent: 10, prize: Math.floor(prizePool * 0.10) },
    { rank: '4-5th', percent: 8, prize: Math.floor(prizePool * 0.08) },
    { rank: '6-10th', percent: 8, prize: Math.floor(prizePool * 0.08) },
    { rank: '11-25th', percent: 10, prize: Math.floor(prizePool * 0.10) },
    { rank: '26-50th', percent: 8, prize: Math.floor(prizePool * 0.08) },
    { rank: '51-100th', percent: 8, prize: Math.floor(prizePool * 0.08) },
    { rank: '101-200th', percent: 8, prize: Math.floor(prizePool * 0.08) },
  ];
}

export default function Tournaments() {
  const { authFetch, refreshUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(null);
  const [showWinningsModal, setShowWinningsModal] = useState(null); // tournament object or null

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await authFetch('/tournaments');
      setTournaments(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
      setError('Could not load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (t) => {
    if (user.wallet < t.entryFee) {
      alert('Insufficient balance in wallet!');
      return;
    }

    try {
      setRegistering(t._id);
      await authFetch(`/tournaments/${t._id}/register`, { method: 'POST' });
      await refreshUser();
      await fetchTournaments();
      alert(`Successfully registered for ${t.name}!`);
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegistering(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registering': return <span className="px-2.5 py-1 rounded-full text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase">Open</span>;
      case 'upcoming': return <span className="px-2.5 py-1 rounded-full text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase">Upcoming</span>;
      case 'in_progress': return <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase animate-pulse">🔴 Live</span>;
      default: return null;
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && tournaments.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chess-green"></div>
      </div>
    );
  }

  return (
    <div className="bg-hero px-4 py-8">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-navy-800/80 backdrop-blur border border-navy-700/50 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-gold-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/20 ring-4 ring-amber-400/20">
              🏆
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Tournaments</h1>
              <p className="text-slate-400 max-w-md">Join massive tournaments with 50-500 players. Play matches, earn points, and climb the leaderboard to win!</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3">
            <div className="bg-navy-950/50 backdrop-blur p-4 rounded-xl border border-navy-700/50 text-center">
              <div className="text-xs text-slate-500 uppercase font-black mb-1">Your Wallet</div>
              <div className="text-2xl font-black text-white">₹{user?.wallet || 0}</div>
            </div>
            <div className="bg-navy-950/50 backdrop-blur p-4 rounded-xl border border-navy-700/50 text-center">
              <div className="text-xs text-slate-500 uppercase font-black mb-1">Points System</div>
              <div className="flex gap-3 mt-1">
                <div><span className="text-emerald-400 font-black text-sm">1.0</span><span className="text-[10px] text-slate-500 ml-1">Win</span></div>
                <div><span className="text-amber-400 font-black text-sm">0.5</span><span className="text-[10px] text-slate-500 ml-1">Draw</span></div>
                <div><span className="text-red-400 font-black text-sm">0</span><span className="text-[10px] text-slate-500 ml-1">Loss</span></div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center mb-8">
            {error}
          </div>
        )}

        {/* Tournament Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(t => {
            const isRegistered = t.registeredPlayers.includes(user?._id);
            const isFull = t.registeredPlayers.length >= t.maxPlayers;
            const progress = (t.registeredPlayers.length / t.maxPlayers) * 100;
            const spotsLeft = t.maxPlayers - t.registeredPlayers.length;

            return (
              <div key={t._id} className={`group relative bg-navy-800/50 border ${isRegistered ? 'border-chess-green/30' : 'border-navy-700/50'} rounded-2xl overflow-hidden hover:border-navy-500 transition-all duration-300 shadow-xl flex flex-col`}>
                {/* Image/Emoji Header */}
                <div className="h-32 bg-navy-900 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-navy-900/50 to-navy-950/80 z-10"></div>
                  <div className="text-6xl z-20 transform group-hover:scale-110 transition-transform duration-500">🛡️</div>
                  <div className="absolute top-3 left-3 z-20">
                    {getStatusBadge(t.status)}
                  </div>
                  <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-black text-gold-400 uppercase border border-gold-400/20">
                    ₹{t.prizePool} PRIZE
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-1">{t.name}</h3>
                  <p className="text-slate-500 text-xs mb-4 flex items-center gap-1">
                    <span>🕒</span> Starts {formatTime(t.startTime)}
                  </p>

                  <div className="space-y-4 mb-4">
                    {/* Players progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1.5">
                        <span className="text-slate-400">Players Joined</span>
                        <span className="text-white">{t.registeredPlayers.length} / {t.maxPlayers}</span>
                      </div>
                      <div className="h-2 bg-navy-900 rounded-full overflow-hidden border border-navy-700/50">
                        <div 
                          className={`h-full bg-gradient-to-r ${isRegistered ? 'from-chess-green to-emerald-400' : 'from-amber-400 to-amber-600'} transition-all duration-1000`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      {spotsLeft > 0 && spotsLeft <= 20 && (
                        <p className="text-[10px] text-amber-400 font-bold mt-1 animate-pulse">⚡ Only {spotsLeft} spots left!</p>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-navy-900/40 p-2 rounded-lg text-center border border-navy-700/30">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Pool</div>
                        <div className="text-xs font-black text-emerald-400">₹{t.prizePool}</div>
                      </div>
                      <div className="bg-navy-900/40 p-2 rounded-lg text-center border border-navy-700/30">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Players</div>
                        <div className="text-xs font-black text-white">{t.maxPlayers}</div>
                      </div>
                      <div className="bg-navy-900/40 p-2 rounded-lg text-center border border-navy-700/30">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Spots</div>
                        <div className={`text-xs font-black ${spotsLeft > 0 ? 'text-amber-400' : 'text-red-400'}`}>{spotsLeft > 0 ? spotsLeft : 'Full'}</div>
                      </div>
                    </div>
                  </div>

                  {/* View Winnings */}
                  <button
                    onClick={() => setShowWinningsModal(t)}
                    className="text-[11px] text-chess-green font-bold mb-3 hover:underline text-left flex items-center gap-1 transition-all hover:text-emerald-300"
                  >
                    🏅 View Winnings →
                  </button>

                  <div className="mt-auto pt-4 border-t border-navy-700/30 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-black">Entry Fee</div>
                      <div className="text-lg font-black text-white">₹{t.entryFee}</div>
                    </div>

                    {isRegistered ? (
                      <button 
                        disabled 
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-chess-green/10 text-chess-green border border-chess-green/30 cursor-default"
                      >
                        ✓ Registered
                      </button>
                    ) : t.status === 'in_progress' ? (
                      <button 
                        onClick={() => navigate(`/room/${t._id}`)}
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all"
                      >
                        Watch Live
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRegister(t)}
                        disabled={isFull || registering === t._id}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                          isFull 
                            ? 'bg-navy-700 text-slate-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-chess-green to-emerald-600 hover:shadow-lg hover:shadow-chess-green/30 text-white'
                        }`}
                      >
                        {registering === t._id ? 'Joining...' : isFull ? 'Full' : 'Join Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {tournaments.length === 0 && !loading && (
          <div className="bg-navy-800/50 border border-navy-700/50 p-20 rounded-2xl text-center">
            <div className="text-6xl mb-4 opacity-20">📭</div>
            <p className="text-slate-400 font-medium">No active tournaments scheduled at the moment.<br/>Check back later for grand events!</p>
          </div>
        )}
      </div>

      {/* ── Tournament Winnings Modal ── */}
      {showWinningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowWinningsModal(null)}>
          <div className="bg-navy-800 border border-navy-700/50 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const t = showWinningsModal;
              const prizes = getTournamentPrizes(t.prizePool, t.maxPlayers);
              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-white">🏅 Tournament Winnings</h2>
                    <button onClick={() => setShowWinningsModal(null)} className="text-slate-400 hover:text-white text-lg font-bold transition-colors">✕</button>
                  </div>

                  {/* Tournament Name */}
                  <div className="bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/20 p-4 rounded-xl mb-5 text-center">
                    <h3 className="text-base font-black text-white mb-1">{t.name}</h3>
                    <p className="text-2xl font-black text-gold-400">₹{t.prizePool}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Total Prize Pool</p>
                  </div>

                  {/* How it works */}
                  <div className="bg-navy-900/40 p-3 rounded-xl border border-navy-700/30 mb-5">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">📋 How It Works</h4>
                    <ul className="text-[11px] text-slate-400 space-y-1">
                      <li>• All players play multiple matches</li>
                      <li>• <span className="text-emerald-400 font-bold">Win = 1 point</span>, <span className="text-amber-400 font-bold">Draw = 0.5 points</span></li>
                      <li>• Final rankings = total points</li>
                      <li>• Top ranks win prizes below</li>
                    </ul>
                  </div>

                  {/* Prize Table */}
                  <div className="bg-navy-900/40 rounded-xl border border-navy-700/30 overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-navy-900/80 border-b border-navy-700/30">
                      <span className="text-[10px] text-slate-500 font-black uppercase">Rank</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase text-center">Share</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase text-right">Prize</span>
                    </div>
                    {prizes.map((p, i) => (
                      <div key={i} className={`grid grid-cols-3 gap-2 px-4 py-3 ${i < prizes.length - 1 ? 'border-b border-navy-700/20' : ''} ${i === 0 ? 'bg-gold-500/5' : ''}`}>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}
                          <span className={i === 0 ? 'text-gold-400' : 'text-slate-300'}>{p.rank}</span>
                        </span>
                        <span className="text-sm text-slate-400 font-medium text-center">{p.percent}%</span>
                        <span className={`text-sm font-black text-right ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>₹{p.prize}</span>
                      </div>
                    ))}
                  </div>

                  {/* Player count */}
                  <div className="mt-4 flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 px-4 py-3 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold">Max Players</span>
                    <span className="text-sm font-black text-white">{t.maxPlayers}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-3 text-center">Prizes distributed after tournament ends. Multiple players in same rank bracket share the prize equally.</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
