import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function Lobby() {
  const { token, user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contestTypes, setContestTypes] = useState([]);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [joiningId, setJoiningId] = useState(null); // which type is currently joining
  
  const socketRef = useRef(null);

  useEffect(() => {
    fetchContests();
    const iv = setInterval(fetchContests, 5000);
    
    // Setup socket
    socketRef.current = io(SOCKET_URL);
    const socket = socketRef.current;

    if (user?.id) {
      socket.emit('identify', { userId: user.id });
    }

    // Error from join attempt
    socket.on('contestError', (data) => {
      setMessage(data.message || 'Failed to join');
      setMsgType('error');
      setJoiningId(null);
    });

    // Successfully joined — navigate to room
    socket.on('joinedContest', (data) => {
      refreshUser();
      setJoiningId(null);
      navigate(`/room/${data.contestId}`);
    });

    // Match started — navigate to room
    socket.on('matchStarted', (data) => {
      refreshUser();
      setJoiningId(null);
      navigate(`/room/${data.contestId}`);
    });

    // Contest slots updated — refresh list
    socket.on('contestUpdated', () => {
      fetchContests();
    });

    return () => {
      clearInterval(iv);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, navigate, refreshUser]);

  const fetchContests = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/contests`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setContestTypes(await res.json());
    } catch (e) {}
  };

  const handleJoin = (ct) => {
    if (!user) return;
    if (joiningId) return; // already joining something

    if (ct.entry > 0 && (user.wallet || 0) < ct.entry) {
      setMessage(`Insufficient balance! Need ₹${ct.entry}, have ₹${user.wallet}`);
      setMsgType('error');
      return;
    }

    setMessage('');
    setJoiningId(ct._id);

    // Send contestTypeId — backend will find an open slot
    socketRef.current?.emit('joinContest', { contestTypeId: ct._id, userId: user.id });
  };

  return (
    <div className="min-h-screen bg-hero">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-black text-white mb-2">Chess Arena</h1>
        <p className="text-slate-400 text-sm mb-6">Pick a contest and play!</p>

        {message && (
          <div className={`mb-4 p-3 rounded-xl border text-sm font-medium animate-slide-down ${
            msgType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>{message}</div>
        )}

        {user?.username === 'kabir' && (
          <div className="mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/15 to-amber-600/15 border border-gold-500/30 text-gold-400 text-sm font-bold hover:border-gold-500/50 transition-all flex items-center gap-2"
            >
              <span>⚙️</span> Admin Panel
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contestTypes.map((ct) => {
            const isJoining = joiningId === ct._id;
            const hasWaiting = ct.waitingCount > 0;

            return (
              <div key={ct._id} className="contest-card p-5">
                <h2 className="text-lg font-bold text-white mb-1">{ct.name}</h2>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Entry: <b className="text-white">₹{ct.entry}</b></span>
                  <span className="text-chess-green text-sm font-bold">Win ₹{ct.payout}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-xs">{ct.openCount || 0} open slots</span>
                  {hasWaiting && (
                    <span className="badge-green text-[10px]">⚡ {ct.waitingCount} waiting</span>
                  )}
                </div>

                <button
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] ${
                    isJoining
                      ? 'bg-navy-600 text-slate-300 cursor-wait'
                      : 'bg-gradient-to-r from-chess-green to-emerald-600 hover:shadow-lg hover:shadow-chess-green/30'
                  }`}
                  onClick={() => handleJoin(ct)}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Finding match...
                    </span>
                  ) : hasWaiting ? (
                    '⚡ Join Now — Instant Match!'
                  ) : (
                    `Join — ₹${ct.entry}`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
