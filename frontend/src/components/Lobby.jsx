import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function Lobby() {
  const { token, user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  const [selectedEntry, setSelectedEntry] = useState('ALL');
  const [selectedTime, setSelectedTime] = useState('10');

  const socketRef = useRef(null);

  const ENTRIES = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
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
    <div className="w-full bg-hero">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-3xl font-black text-white mb-2">Arena Contests</h1>
        <p className="text-slate-400 text-sm mb-6">Select your stakes, format, and time control to dominate.</p>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-bold animate-slide-down shadow-xl ${
            msgType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>{message}</div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8 bg-navy-800/40 p-4 rounded-2xl border border-navy-700/50 backdrop-blur-sm">
          <div>
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
            const players = 2; // Fixed to 2 players
            const time = Number(selectedTime);
            const totalPot = entry * players;
            const fee = Math.floor(totalPot * 0.15);
            const prize = totalPot - fee;
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
                      <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">Direct Match</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Prize</span>
                      <span className="text-lg font-black text-emerald-400 leading-none mt-0.5">₹{prize}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex justify-between items-center bg-navy-900/40 px-3 py-2 rounded-lg border border-navy-700/30">
                      <span className="text-xs text-slate-400 font-medium">Entry Fee</span>
                      <span className="text-sm text-white font-black">₹{entry}</span>
                    </div>
                  </div>

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
    </div>
  );
}
