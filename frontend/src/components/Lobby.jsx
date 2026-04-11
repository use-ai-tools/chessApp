import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function Lobby() {
  const { token, user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contests, setContests] = useState([]);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  
  const socketRef = useRef(null);

  useEffect(() => {
    fetchContests();
    const iv = setInterval(fetchContests, 5000);
    
    socketRef.current = io(SOCKET_URL);
    if (user?.id) {
       socketRef.current.emit('identify', { userId: user.id });
    }

    socketRef.current.on('contestError', (data) => {
       setMessage(data.message || 'Failed to join');
       setMsgType('error');
    });

    socketRef.current.on('waitingForOpponent', (data) => {
       refreshUser();
       navigate(`/room/${data.contestId}`);
    });
    
    socketRef.current.on('opponentFound', (data) => {
       refreshUser();
       navigate(`/room/${data.contestId}`);
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
      if (res.ok) setContests(await res.json());
    } catch (e) {}
  };

  const handleJoin = (contest) => {
    if (!user) return;
    if ((user.wallet || 0) < contest.entry) {
      setMessage(`Insufficient balance! Need ₹${contest.entry}, have ₹${user.wallet}`);
      setMsgType('error');
      return;
    }
    
    setMessage('');
    
    // Choose which contest ID to join based on what's available
    const joinId = contest.waitingCount > 0 && contest.waitingPlayers.length > 0
      ? contest.waitingPlayers[0].contestId
      : (contest.emptyContests && contest.emptyContests.length > 0 ? contest.emptyContests[0] : null);
      
    if (!joinId) {
       setMessage('No slots available for this contest right now.');
       setMsgType('error');
       return;
    }

    socketRef.current?.emit('joinContest', { contestId: joinId, userId: user.id });
  };

  return (
    <div className="min-h-screen bg-hero">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-black text-white mb-6">Chess Arena</h1>
        {message && (
          <div className={`mb-4 p-3 rounded-xl border text-sm font-medium ${
            msgType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>{message}</div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contests.map((contest, index) => {
             const key = contest._id || index;
             const isFull = (!contest.waitingCount && (!contest.emptyContests || contest.emptyContests.length === 0));
             return (
              <div key={key} className="p-5 rounded-xl bg-navy-900/60 border border-navy-700/20 shadow">
                <h2 className="text-lg font-bold text-white mb-2">{contest.name}</h2>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Entry: <b className="text-white">₹{contest.entry}</b></span>
                  <span className="text-chess-green text-sm">Prize: <b>₹{contest.payout}</b></span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-xs">{contest.openCount || 0} open slots</span>
                  {contest.waitingCount > 0 && (
                    <span className="text-chess-green text-xs font-bold">{contest.waitingCount} waiting... Join now!</span>
                  )}
                </div>
                <button
                  className={`w-full py-2 rounded-xl text-sm font-black text-white shadow-lg ${isFull ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-chess-green to-emerald-600 hover:shadow-chess-green/40'}`}
                  onClick={() => handleJoin(contest)}
                  disabled={isFull}
                >
                  {isFull ? 'Full' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
