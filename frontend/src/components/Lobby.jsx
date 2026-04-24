import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// ── Prize Distribution Logic ──
function getPrizeDistribution(totalPot, playersCount) {
  const fee = Math.floor(totalPot * 0.15);
  const prize = totalPot - fee;

  if (playersCount <= 2) {
    return { fee, totalPrize: prize, breakdown: [{ rank: 1, prize, percent: 100 }] };
  }
  if (playersCount === 3) {
    const first = Math.floor(prize * 0.6);
    const second = prize - first;
    return {
      fee, totalPrize: prize,
      breakdown: [
        { rank: 1, prize: first, percent: 60 },
        { rank: 2, prize: second, percent: 40 },
      ]
    };
  }
  if (playersCount === 4) {
    const first = Math.floor(prize * 0.5);
    const second = Math.floor(prize * 0.3);
    const third = prize - first - second;
    return {
      fee, totalPrize: prize,
      breakdown: [
        { rank: 1, prize: first, percent: 50 },
        { rank: 2, prize: second, percent: 30 },
        { rank: 3, prize: third, percent: 20 },
      ]
    };
  }
  // 5+ players
  const first = Math.floor(prize * 0.45);
  const second = Math.floor(prize * 0.25);
  const third = Math.floor(prize * 0.15);
  const fourth = prize - first - second - third;
  return {
    fee, totalPrize: prize,
    breakdown: [
      { rank: 1, prize: first, percent: 45 },
      { rank: 2, prize: second, percent: 25 },
      { rank: 3, prize: third, percent: 15 },
      { rank: 4, prize: fourth, percent: 15 },
    ]
  };
}

function getMatchType(playersCount) {
  if (playersCount === 2) return { type: 'Direct Match', desc: '1v1 head-to-head. Winner takes the prize.', icon: '⚔️' };
  if (playersCount === 3) return { type: 'Round Robin', desc: 'Each player plays against every other player. Points decide rankings.', icon: '🔄' };
  return { type: 'Knockout Bracket', desc: 'Single elimination bracket. Lose once and you\'re out!', icon: '🏆' };
}

export default function Lobby() {
  const { token, user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  const [selectedEntry, setSelectedEntry] = useState('ALL');
  const [selectedPlayers, setSelectedPlayers] = useState('2');
  const [selectedTime, setSelectedTime] = useState('10');

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(null); // entry amount or null

  const socketRef = useRef(null);

  const ENTRIES = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
  const PLAYERS = [2, 3, 4, 10];
  const TIMES = [3, 5, 10];

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { reconnection: true, transports: ['websocket'], timeout: 60000 });
    const socket = socketRef.current;

    if (user?.id) socket.emit('identify', { userId: user.id });

    socket.on('contestError', (data) => {
      setMessage(data.message || 'Failed to join');
      setMsgType('error');
      setJoiningId(null);
    });

    socket.on('joinedContest', (data) => {
      refreshUser();
      setJoiningId(null);
      navigate(`/room/${data.contestId}`);
    });

    socket.on('matchStarted', (data) => {
      refreshUser();
      setJoiningId(null);
      navigate(`/room/${data.contestId}`);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, navigate, refreshUser]);

  const handleJoin = (entry, playersCount, timeControl) => {
    if (!user) return;
    if (joiningId) return;

    if (entry > 0 && (user.wallet || 0) < entry) {
      setMessage(`Insufficient balance! Need ₹${entry}, have ₹${user.wallet}`);
      setMsgType('error');
      return;
    }

    const uniqueId = `${entry}-${playersCount}-${timeControl}`;
    setMessage('');
    setJoiningId(uniqueId);

    // If players > 2, show coming soon for now
    if (playersCount > 2) {
      setTimeout(() => {
        setMessage(`Multiplayer tournaments (${playersCount} players) are currently being finalized. Try 1v1 for now!`);
        setMsgType('error');
        setJoiningId(null);
      }, 500);
      return;
    }

    socketRef.current?.emit('joinDynamicContest', { entry, playersCount, timeControl, userId: user.id });
  };

  const filteredEntries = selectedEntry === 'ALL' ? ENTRIES : [Number(selectedEntry)];

  return (
    <div className="w-full bg-hero pb-28 lg:pb-8 min-h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {/* Title with Info Icon */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-black text-white">Arena Contests</h1>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-7 h-7 rounded-full bg-navy-700/80 border border-navy-600 flex items-center justify-center text-slate-400 hover:text-white hover:bg-navy-600 hover:border-chess-green/30 transition-all text-sm font-bold"
            title="Contest Info"
          >
            ?
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-6">Select your stakes, format, and time control to dominate.</p>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-bold animate-slide-down shadow-xl ${
            msgType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>{message}</div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-navy-800/40 p-4 rounded-2xl border border-navy-700/50 backdrop-blur-sm">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Players</label>
            <div className="flex flex-wrap gap-2">
              {PLAYERS.map(p => (
                <button key={p} onClick={() => setSelectedPlayers(p.toString())} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedPlayers === p.toString() ? 'bg-chess-green text-white shadow-lg shadow-chess-green/20' : 'bg-navy-900/80 text-slate-400 hover:text-white border border-navy-700/50'
                }`}>{p} Players</button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Time Control</label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(t => (
                <button key={t} onClick={() => setSelectedTime(t.toString())} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedTime === t.toString() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-navy-900/80 text-slate-400 hover:text-white border border-navy-700/50'
                }`}>{t} Min</button>
              ))}
            </div>
          </div>
        </div>

        {/* Contest Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map(entry => {
            const players = Number(selectedPlayers);
            const time = Number(selectedTime);
            const totalPot = entry * players;
            const dist = getPrizeDistribution(totalPot, players);
            const matchInfo = getMatchType(players);
            const uniqueId = `${entry}-${players}-${time}`;
            const isJoining = joiningId === uniqueId;

            return (
              <div key={uniqueId} className="card-hover p-0 overflow-hidden flex flex-col relative group">
                {/* Decorative top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-chess-green via-emerald-400 to-chess-green"></div>
                
                <div className="p-5 flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{time} Min Match</h3>
                      <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                        <span>{matchInfo.icon}</span> {players} Players • {matchInfo.type}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Prize Pool</span>
                      <span className="text-lg font-black text-emerald-400 leading-none mt-0.5">₹{dist.totalPrize}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center bg-navy-900/40 px-3 py-2 rounded-lg border border-navy-700/30">
                      <span className="text-xs text-slate-400 font-medium">Entry Fee</span>
                      <span className="text-sm text-white font-black">₹{entry}</span>
                    </div>
                    {/* Winners preview */}
                    <div className="bg-navy-900/40 px-3 py-2 rounded-lg border border-navy-700/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-medium">Winners</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{dist.breakdown.length} {dist.breakdown.length === 1 ? 'Winner' : 'Winners'}</span>
                      </div>
                      <div className="flex gap-1">
                        {dist.breakdown.slice(0, 3).map((b, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className={`text-[10px] font-black ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'}`}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                            </div>
                            <div className="text-[10px] text-white font-bold">₹{b.prize}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* View Prizes Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPrizeModal({ entry, players, time }); }}
                    className="text-[11px] text-chess-green font-bold mb-3 hover:underline text-left flex items-center gap-1 transition-all hover:text-emerald-300"
                  >
                    💰 View Full Prize Table →
                  </button>

                  <button
                    onClick={() => handleJoin(entry, players, time)}
                    disabled={isJoining}
                    className={`mt-auto w-full py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      isJoining ? 'bg-navy-600 cursor-wait' : 'bg-gradient-to-r from-chess-green to-emerald-600 hover:shadow-lg hover:shadow-chess-green/20'
                    }`}
                  >
                    {isJoining ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Joining...</>
                    ) : (
                      `Play for ₹${entry}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Contest Info Modal ── */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowInfoModal(false)}>
          <div className="bg-navy-800 border border-navy-700/50 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Contest Format Guide</h2>
                <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-white text-xl font-bold transition-colors">✕</button>
              </div>

              <div className="space-y-4">
                {/* Direct Match */}
                <div className="bg-navy-900/60 border border-navy-700/30 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-xl border border-sky-500/20">⚔️</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Direct Match</h3>
                      <span className="text-[10px] text-sky-400 font-bold uppercase">2 Players</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Head-to-head 1v1 battle. Winner takes the entire prize pool.</p>
                </div>

                {/* Round Robin */}
                <div className="bg-navy-900/60 border border-navy-700/30 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl border border-amber-500/20">🔄</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Round Robin</h3>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">3 Players</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Every player plays against every other player. Final rankings based on total points. Win=1, Draw=0.5, Loss=0.</p>
                </div>

                {/* Knockout */}
                <div className="bg-navy-900/60 border border-navy-700/30 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl border border-purple-500/20">🏆</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Knockout Bracket</h3>
                      <span className="text-[10px] text-purple-400 font-bold uppercase">4+ Players</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Single elimination tournament bracket. Lose one match and you're eliminated. Last player standing wins!</p>
                </div>
              </div>

              {/* Rules Summary */}
              <div className="mt-5 p-3 bg-chess-green/5 border border-chess-green/10 rounded-xl">
                <h4 className="text-xs font-bold text-chess-green mb-1.5">📋 Quick Rules</h4>
                <ul className="text-[11px] text-slate-400 space-y-1">
                  <li>• 2 Players → Direct Match (1v1)</li>
                  <li>• 3 Players → Round Robin (play everyone)</li>
                  <li>• 4+ Players → Knockout Bracket (single elimination)</li>
                  <li>• Multiple winners share the prize pool</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Prize Breakdown Modal (Dream11-style) ── */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowPrizeModal(null)}>
          <div className="bg-navy-800 border border-navy-700/50 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            {(() => {
              const { entry, players, time } = showPrizeModal;
              const totalPot = entry * players;
              const dist = getPrizeDistribution(totalPot, players);
              const matchInfo = getMatchType(players);

              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-white">Prize Breakdown</h2>
                    <button onClick={() => setShowPrizeModal(null)} className="text-slate-400 hover:text-white text-lg font-bold transition-colors">✕</button>
                  </div>

                  {/* Header stats */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-navy-900/60 p-3 rounded-xl text-center border border-navy-700/30">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Entry</div>
                      <div className="text-sm font-black text-white">₹{entry}</div>
                    </div>
                    <div className="bg-navy-900/60 p-3 rounded-xl text-center border border-navy-700/30">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Pool</div>
                      <div className="text-sm font-black text-emerald-400">₹{totalPot}</div>
                    </div>
                    <div className="bg-navy-900/60 p-3 rounded-xl text-center border border-navy-700/30">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Format</div>
                      <div className="text-sm font-black text-white">{matchInfo.icon}</div>
                    </div>
                  </div>

                  {/* Prize Table */}
                  <div className="bg-navy-900/40 rounded-xl border border-navy-700/30 overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-navy-900/80 border-b border-navy-700/30">
                      <span className="text-[10px] text-slate-500 font-black uppercase">Rank</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase text-center">%</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase text-right">Prize</span>
                    </div>
                    {dist.breakdown.map((b, i) => (
                      <div key={i} className={`grid grid-cols-3 gap-2 px-4 py-3 ${i < dist.breakdown.length - 1 ? 'border-b border-navy-700/20' : ''} ${i === 0 ? 'bg-gold-500/5' : ''}`}>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${b.rank}`}
                          <span className={i === 0 ? 'text-gold-400' : 'text-slate-300'}>#{b.rank}</span>
                        </span>
                        <span className="text-sm text-slate-400 font-medium text-center">{b.percent}%</span>
                        <span className={`text-sm font-black text-right ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>₹{b.prize}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total winnable */}
                  <div className="mt-4 flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 px-4 py-3 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold">Total Distributed</span>
                    <span className="text-lg font-black text-emerald-400">₹{dist.totalPrize}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-3 text-center">15% platform fee deducted from pool</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
