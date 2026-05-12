import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const QUICK_MESSAGES = ['Hello! 👋', 'Good game!', 'Anyone want to play?', 'Nice move! 🔥', 'GG 🤝', 'Let\'s go! ⚡'];

export default function Community() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeTab, setActiveTab] = useState('chat');

  // Socket connection for global chat
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { reconnection: true, transports: ['websocket'], timeout: 60000 });
    const socket = socketRef.current;

    if (user?.id) socket.emit('identify', { userId: user.id });

    socket.on('lobbyChat', (msgData) => {
      setChatMessages(prev => {
        const updated = [...prev, msgData];
        return updated.slice(-100); // Keep last 100 messages
      });
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?limit=10`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || data || []);
        }
      } catch (err) {}
    };
    fetchLeaderboard();
  }, []);

  const sendMessage = (msg) => {
    const text = msg || chatInput.trim();
    if (!text || !user) return;
    socketRef.current?.emit('lobbyChat', { message: text, username: user.username });
    setChatInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  // Coming soon features
  const comingSoon = [
    { icon: '👥', title: 'Clubs', desc: 'Create or join chess clubs' },
    { icon: '🤝', title: 'Friends', desc: 'Add friends and challenge them' },
    { icon: '🏅', title: 'Achievements', desc: 'Earn badges for milestones' },
    { icon: '🧩', title: 'Daily Puzzle', desc: 'New puzzle every day' },
    { icon: '👀', title: 'Spectate', desc: 'Watch friends play live' },
    { icon: '🔥', title: 'Win Streaks', desc: 'Track your winning runs' },
  ];

  return (
    <div className="w-full bg-hero flex-1 px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-black text-white">Community</h1>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 bg-navy-800/30 rounded-xl p-1 max-w-md">
          {[
            { id: 'chat', label: '💬 Chat' },
            { id: 'leaderboard', label: '🏆 Leaderboard' },
            { id: 'more', label: '✨ More' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-chess-green/15 text-chess-green'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chat Panel */}
            <div className="flex-1 bg-navy-800/30 rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
              <div className="px-4 py-3 border-b border-navy-700/20 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Global Chat</h3>
                <span className="text-[10px] text-slate-500">{chatMessages.length} messages</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'thin', minHeight: '300px' }}>
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.username === user?.username ? 'justify-end' : ''}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                      msg.username === user?.username
                        ? 'bg-chess-green/15 text-white'
                        : 'bg-navy-900/40 text-slate-300'
                    }`}>
                      <span className={`font-bold mr-1.5 ${
                        msg.username === user?.username ? 'text-chess-green' : 'text-sky-400'
                      }`}>
                        {msg.username}
                      </span>
                      {msg.message}
                      {msg.ts && (
                        <span className="text-[9px] text-slate-600 ml-2">
                          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Chat */}
              <div className="px-3 py-2 border-t border-navy-700/20 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {QUICK_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(msg)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-navy-700/20 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  maxLength={200}
                  className="flex-1 bg-navy-900/60 border border-navy-700/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-chess-green/30"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-chess-green/15 text-chess-green hover:bg-chess-green/25 disabled:opacity-40 transition-all"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Sidebar — Quick Actions */}
            <div className="lg:w-72 flex flex-col gap-4">
              <button
                onClick={() => navigate('/contests')}
                className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all"
              >
                ⚔️ Find a Match
              </button>
              <button
                onClick={() => navigate('/puzzles')}
                className="w-full py-3 rounded-xl text-sm font-bold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all"
              >
                🧩 Play Puzzles
              </button>
              <button
                onClick={() => navigate('/watch')}
                className="w-full py-3 rounded-xl text-sm font-bold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                📺 Watch Games
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="max-w-2xl">
            <div className="bg-navy-800/30 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-navy-700/20">
                <h3 className="text-sm font-bold text-white">Top Players</h3>
              </div>
              <div className="divide-y divide-navy-700/10">
                {leaderboard.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">Loading leaderboard...</div>
                )}
                {leaderboard.map((player, i) => (
                  <div key={player._id || i} className={`flex items-center gap-3 px-4 py-3 ${
                    player.username === user?.username ? 'bg-chess-green/5' : ''
                  }`}>
                    <span className="w-6 text-center text-sm font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-gold-500/20 text-gold-400' : 'bg-navy-700/50 text-slate-400'
                    }`}>
                      {player.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {player.username}
                        {player.username === user?.username && <span className="text-chess-green text-[10px] ml-1.5 font-bold">YOU</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {player.gamesPlayed || 0} games • {player.wins || 0}W / {player.losses || 0}L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-400">{player.elo?.free || player.elo || 1200}</p>
                      <p className="text-[9px] text-slate-600">ELO</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-navy-700/20 text-center">
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-xs text-chess-green/70 hover:text-chess-green font-semibold transition-colors"
                >
                  View Full Leaderboard →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* More Tab — Coming Soon */}
        {activeTab === 'more' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
            {comingSoon.map((item, i) => (
              <div key={i} className="bg-navy-800/30 rounded-xl p-5 flex flex-col items-center text-center opacity-60 hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
                <span className="mt-3 text-[9px] font-bold text-slate-600 bg-navy-900/40 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
