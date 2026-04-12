import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Tournaments() {
  const { authFetch, refreshUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(null); // ID of tournament currently registering

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
      await refreshUser(); // Update wallet balance
      await fetchTournaments(); // Refresh list to show registration
      alert(`Successfully registered for ${t.name}!`);
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegistering(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registering': return <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase">Open</span>;
      case 'upcoming': return <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase">Upcoming</span>;
      case 'in_progress': return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">Live</span>;
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
    <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-8 pb-24">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-navy-800/80 backdrop-blur border border-navy-700/50 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-gold-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/20 ring-4 ring-amber-400/20">
              🏆
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Scheduled Tournaments</h1>
              <p className="text-slate-400 max-w-md">Compete in massive multi-round bracket tournaments for legendary prizes.</p>
            </div>
          </div>

          <div className="relative z-10 bg-navy-950/50 backdrop-blur p-4 rounded-xl border border-navy-700/50 w-full md:w-auto text-center">
            <div className="text-xs text-slate-500 uppercase font-black mb-1">Your Wallet</div>
            <div className="text-2xl font-black text-white">₹{user?.wallet || 0}</div>
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

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-400">Players Joined</span>
                      <span className="text-white">{t.registeredPlayers.length} / {t.maxPlayers}</span>
                    </div>
                    <div className="h-2 bg-navy-900 rounded-full overflow-hidden border border-navy-700/50">
                      <div 
                        className={`h-full bg-gradient-to-r ${isRegistered ? 'from-chess-green to-emerald-400' : 'from-amber-400 to-amber-600'} transition-all duration-1000`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-navy-700/30 flex items-center justify-between">
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
    </div>
  );
}
