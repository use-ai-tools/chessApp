import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// ── Prize Distribution Logic ──
// 2, 3, 4 players → 1 winner only (15% platform fee)
// 10 players → 1st: 50%, 2nd: 20%, 3rd: 10% of total pot (20% platform fee)
function getPrizeDistribution(totalPot, playersCount) {
  if (playersCount <= 4) {
    // Single winner takes all (15% platform fee)
    const fee = Math.floor(totalPot * 0.15);
    const prize = totalPot - fee;
    return { fee, totalPrize: prize, breakdown: [{ rank: 1, prize, percent: 100 }] };
  }
  // 10 players: 20% platform fee, 3 winners
  const fee = Math.floor(totalPot * 0.20);
  const first = Math.floor(totalPot * 0.50);
  const second = Math.floor(totalPot * 0.20);
  const third = Math.floor(totalPot * 0.10);
  const totalPrize = first + second + third;
  return {
    fee, totalPrize,
    breakdown: [
      { rank: 1, prize: first, percent: 50 },
      { rank: 2, prize: second, percent: 20 },
      { rank: 3, prize: third, percent: 10 },
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
  const { format, formatShort, currency, changeCurrency, currencies, getSymbol } = useCurrency();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  // Item 6: Load persisted filters from localStorage
  const savedFilters = (() => { try { return JSON.parse(localStorage.getItem('chess-lobby-filters') || '{}'); } catch { return {}; } })();
  const [selectedEntry, setSelectedEntry] = useState(savedFilters.entry || 'ALL');
  const [selectedPlayers, setSelectedPlayers] = useState(savedFilters.players || '2');
  const [selectedTime, setSelectedTime] = useState(savedFilters.time || '10');

  // Item 7: Sort and filter state
  const [sortBy, setSortBy] = useState(savedFilters.sortBy || 'entry-asc');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const socketRef = useRef(null);

  const ENTRIES = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
  const PLAYERS = [2, 3, 4, 10];
  const TIMES = [3, 5, 10];

  // Item 6: Persist filters to localStorage on change
  useEffect(() => {
    localStorage.setItem('chess-lobby-filters', JSON.stringify({
      entry: selectedEntry, players: selectedPlayers, time: selectedTime, sortBy
    }));
  }, [selectedEntry, selectedPlayers, selectedTime, sortBy]);

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
      setMessage(`Insufficient balance! Need ${format(entry)}, have ${format(user.wallet)}`);
      setMsgType('error');
      return;
    }

    const uniqueId = `${entry}-${playersCount}-${timeControl}`;
    setMessage('');
    setJoiningId(uniqueId);

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

  // Item 7: Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const players = Number(selectedPlayers);
    switch (sortBy) {
      case 'entry-desc': return b - a;
      case 'prize-desc': {
        const potA = a * players, potB = b * players;
        const prizeA = getPrizeDistribution(potA, players).totalPrize;
        const prizeB = getPrizeDistribution(potB, players).totalPrize;
        return prizeB - prizeA;
      }
      case 'entry-asc':
      default: return a - b;
    }
  });

  return (
    <>
    <div className="w-full bg-hero flex-1">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10">
        {/* Title row */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <h1 className="text-2xl font-black text-white">Arena Contests</h1>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
            title="Contest Info"
          >
            ?
          </button>
          {/* Currency Selector */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <span>{currencies[currency]?.flag}</span>
              <span>{currency}</span>
              <span className="text-slate-600 text-[10px]">▼</span>
            </button>
            {showCurrencyPicker && (
              <div className="absolute right-0 top-full mt-1 bg-navy-800 border border-navy-700/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in min-w-[160px]">
                {Object.entries(currencies).map(([code, info]) => (
                  <button
                    key={code}
                    onClick={() => { changeCurrency(code); setShowCurrencyPicker(false); }}
                    className={`flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium transition-all ${
                      currency === code ? 'bg-chess-green/10 text-chess-green' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{info.flag}</span>
                    <span className="font-bold">{code}</span>
                    <span className="text-slate-500 ml-auto">{info.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold animate-slide-down ${
            msgType === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>{message}</div>
        )}

        {/* Filters — flat inline pills */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">Players</label>
            <div className="flex flex-wrap gap-2">
              {PLAYERS.map(p => (
                <button key={p} onClick={() => setSelectedPlayers(p.toString())} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedPlayers === p.toString() ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                }`}>{p}P</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">Time Control</label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(t => (
                <button key={t} onClick={() => setSelectedTime(t.toString())} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedTime === t.toString() ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                }`}>{t} Min</button>
              ))}
            </div>
          </div>
          <div className="sm:ml-auto flex items-end">
            <button
              onClick={() => setShowFilterSheet(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ⭐ Sort & Filter
            </button>
          </div>
        </div>

        {/* Contest Cards — simplified */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedEntries.map(entry => {
            const players = Number(selectedPlayers);
            const time = Number(selectedTime);
            const totalPot = entry * players;
            const dist = getPrizeDistribution(totalPot, players);
            const matchInfo = getMatchType(players);
            const uniqueId = `${entry}-${players}-${time}`;
            const isJoining = joiningId === uniqueId;

            return (
              <div key={uniqueId} className="bg-navy-800/30 rounded-2xl p-5 flex flex-col hover:bg-navy-800/50 transition-all duration-300">
                {/* Title row */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{time} Min Match</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {matchInfo.icon} {players} Players • {matchInfo.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">{formatShort(dist.totalPrize)}</span>
                    <p className="text-[10px] text-slate-600 font-medium">Prize</p>
                  </div>
                </div>

                {/* Info row — flat, no nested boxes */}
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 py-2 border-t border-navy-700/20">
                  <div>
                    <span className="text-slate-600">Entry </span>
                    <span className="text-white font-bold">{formatShort(entry)}</span>
                  </div>
                  <div className="w-px h-3 bg-navy-700/30"></div>
                  <div>
                    <span className="text-slate-600">{dist.breakdown.length === 1 ? '1 Winner' : `${dist.breakdown.length} Winners`}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPrizeModal({ entry, players, time }); }}
                    className="ml-auto text-[10px] text-chess-green/60 hover:text-chess-green transition-colors"
                  >
                    Details →
                  </button>
                </div>

                <button
                  onClick={() => handleJoin(entry, players, time)}
                  disabled={isJoining}
                  className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    isJoining ? 'bg-navy-700 cursor-wait' : 'bg-gradient-to-r from-chess-green to-emerald-600 hover:shadow-md hover:shadow-chess-green/15'
                  }`}
                >
                  {isJoining ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Joining...</>
                  ) : (
                    `Play for ${formatShort(entry)}`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Contest Info Modal ── */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowInfoModal(false)}>
          <div className="bg-navy-800 border border-navy-700/30 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Contest Formats</h2>
                <button onClick={() => setShowInfoModal(false)} className="text-slate-500 hover:text-white text-lg font-bold transition-colors">✕</button>
              </div>

              <div className="space-y-3">
                <div className="bg-navy-900/40 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xl">⚔️</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Direct Match</h3>
                      <span className="text-[10px] text-sky-400 font-semibold">2 Players</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Head-to-head 1v1. Winner takes the prize pool.</p>
                </div>

                <div className="bg-navy-900/40 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xl">🔄</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Round Robin</h3>
                      <span className="text-[10px] text-amber-400 font-semibold">3 Players</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Every player plays every other. Points decide rankings.</p>
                </div>

                <div className="bg-navy-900/40 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xl">🏆</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Knockout Bracket</h3>
                      <span className="text-[10px] text-purple-400 font-semibold">4+ Players</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Single elimination. Lose once and you're out!</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-chess-green/5 rounded-xl">
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li>• 2 Players → 1 Winner</li>
                  <li>• 3 Players → Round Robin → 1 Winner</li>
                  <li>• 4 Players → Knockout → 1 Winner</li>
                  <li>• 10 Players → Knockout → Top 3 share prizes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Prize Breakdown Modal ── */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowPrizeModal(null)}>
          <div className="bg-navy-800 border border-navy-700/30 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            {(() => {
              const { entry, players, time } = showPrizeModal;
              const totalPot = entry * players;
              const dist = getPrizeDistribution(totalPot, players);
              const matchInfo = getMatchType(players);

              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">Prize Breakdown</h2>
                    <button onClick={() => setShowPrizeModal(null)} className="text-slate-500 hover:text-white text-lg font-bold transition-colors">✕</button>
                  </div>

                  <div className="flex gap-4 mb-5 text-center">
                    <div className="flex-1 bg-navy-900/40 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-600 font-semibold uppercase mb-1">Entry</div>
                      <div className="text-sm font-bold text-white">{formatShort(entry)}</div>
                    </div>
                    <div className="flex-1 bg-navy-900/40 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-600 font-semibold uppercase mb-1">Pool</div>
                      <div className="text-sm font-bold text-emerald-400">{formatShort(totalPot)}</div>
                    </div>
                    <div className="flex-1 bg-navy-900/40 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-600 font-semibold uppercase mb-1">Format</div>
                      <div className="text-sm font-bold text-white">{matchInfo.icon}</div>
                    </div>
                  </div>

                  <div className="bg-navy-900/30 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 px-4 py-2.5 border-b border-navy-700/20">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Rank</span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase text-center">%</span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase text-right">Prize</span>
                    </div>
                    {dist.breakdown.map((b, i) => (
                      <div key={i} className={`grid grid-cols-3 gap-2 px-4 py-3 ${i < dist.breakdown.length - 1 ? 'border-b border-navy-700/10' : ''}`}>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${b.rank}`}
                          <span className={i === 0 ? 'text-gold-400' : 'text-slate-400'}>#{b.rank}</span>
                        </span>
                        <span className="text-sm text-slate-500 font-medium text-center">{b.percent}%</span>
                        <span className={`text-sm font-bold text-right ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{formatShort(b.prize)}</span>
                      </div>
                    ))}
                    {Number(selectedPlayers) > 4 && (
                      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-navy-700/10">
                        <span className="text-sm font-medium text-slate-600">4th+</span>
                        <span className="text-sm text-slate-600 font-medium text-center">0%</span>
                        <span className="text-sm font-bold text-right text-slate-600">{getSymbol()}0</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between px-4 py-3 bg-emerald-500/5 rounded-xl">
                    <span className="text-xs text-slate-500 font-semibold">Total Distributed</span>
                    <span className="text-lg font-black text-emerald-400">{formatShort(dist.totalPrize)}</span>
                  </div>

                  <p className="text-[10px] text-slate-600 mt-3 text-center">15% platform fee deducted from pool</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>

      {/* Item 7: Sort & Filter Bottom Sheet Modal */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilterSheet(false)}>
          <div className="bg-navy-800 border-t sm:border border-navy-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Sort & Filter</h2>
                <button onClick={() => setShowFilterSheet(false)} className="text-slate-500 hover:text-white text-lg font-bold transition-colors">✕</button>
              </div>

              {/* Sort Options */}
              <div className="mb-5">
                <label className="block text-[10px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'entry-asc', label: 'Lowest Entry' },
                    { value: 'entry-desc', label: 'Highest Entry' },
                    { value: 'prize-desc', label: 'Highest Prize' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sortBy === opt.value ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Filter */}
              <div className="mb-5">
                <label className="block text-[10px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">Entry Fee</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedEntry('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedEntry === 'ALL' ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                  >All</button>
                  {[1, 5, 10, 25, 50, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => setSelectedEntry(v.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedEntry === v.toString() ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                    >₹{v}</button>
                  ))}
                </div>
              </div>

              {/* Quick Player Count */}
              <div className="mb-5">
                <label className="block text-[10px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">Players</label>
                <div className="flex flex-wrap gap-2">
                  {PLAYERS.map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPlayers(p.toString())}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedPlayers === p.toString() ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                    >{p}P</button>
                  ))}
                </div>
              </div>

              {/* Time Filter */}
              <div className="mb-4">
                <label className="block text-[10px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">Time Control</label>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t.toString())}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedTime === t.toString() ? 'bg-chess-green/15 text-chess-green' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                    >{t} Min</button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowFilterSheet(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
