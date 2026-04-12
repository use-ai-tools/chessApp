import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function AdminPanel() {
  const { authFetch } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPwdError, setAdminPwdError] = useState('');

  // Create contest form
  const [newRoom, setNewRoom] = useState({ roomId: '', name: '', maxPlayers: 4, entryFee: 49, prizeDistribution: 'top4', startTime: '', endTime: '' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  // Edit room form
  const [editingRoom, setEditingRoom] = useState(null);

  // Manual credit form
  const [creditForm, setCreditForm] = useState({ userId: '', amount: '', reason: '' });

  // Search
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'analytics') {
        const data = await authFetch('/admin/analytics');
        setAnalytics(data);
      } else if (activeTab === 'users') {
        const data = await authFetch('/admin/users');
        setUsers(data);
      } else if (activeTab === 'rooms') {
        const data = await authFetch('/admin/rooms');
        setRooms(data);
      } else if (activeTab === 'transactions') {
        const data = await authFetch('/admin/transactions');
        setTransactions(data);
      } else if (activeTab === 'suspicious') {
        const data = await authFetch('/admin/suspicious-users');
        setSuspicious(data);
      } else if (activeTab === 'live') {
        const data = await authFetch('/admin/live-matches');
        setLiveMatches(data);
      }
    } catch (err) {
      console.error('Admin loadData error', err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const createContest = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await authFetch('/rooms/create', {
        method: 'POST',
        body: JSON.stringify({
          roomId: newRoom.roomId || `room-${Date.now()}`,
          name: newRoom.name || `Contest #${newRoom.roomId}`,
          maxPlayers: Number(newRoom.maxPlayers),
          entryFee: Number(newRoom.entryFee),
          prizeDistribution: newRoom.prizeDistribution,
          startTime: newRoom.startTime || null,
          endTime: newRoom.endTime || null,
        }),
      });
      setNewRoom({ roomId: '', name: '', maxPlayers: 4, entryFee: 49, prizeDistribution: 'top4', startTime: '', endTime: '' });
      showMsg('✓ Contest created');
      if (activeTab === 'rooms') loadData();
    } catch (err) {
      showMsg(err.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm(`Delete room ${roomId}? Players in waiting rooms will be refunded.`)) return;
    try {
      await authFetch(`/rooms/${roomId}`, { method: 'DELETE' });
      showMsg('✓ Room deleted');
      loadData();
    } catch (err) {
      showMsg(err.message || 'Failed to delete');
    }
  };

  const editRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      await authFetch(`/admin/rooms/${editingRoom.roomId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingRoom.name,
          entryFee: Number(editingRoom.entryFee),
          maxPlayers: Number(editingRoom.maxPlayers),
          prizeDistribution: editingRoom.prizeDistribution,
        }),
      });
      showMsg('✓ Room updated');
      setEditingRoom(null);
      loadData();
    } catch (err) {
      showMsg(err.message || 'Failed to update');
    }
  };

  const flagUser = async (userId, reason) => {
    try {
      await authFetch('/admin/flag-user', {
        method: 'POST',
        body: JSON.stringify({ userId, reason: reason || 'Manual flag by admin' }),
      });
      showMsg('✓ User flagged');
      loadData();
    } catch (err) {
      showMsg(err.message);
    }
  };

  const banUser = async (userId) => {
    if (!window.confirm('Ban this user? They will not be able to log in.')) return;
    try {
      await authFetch(`/admin/ban/${userId}`, { method: 'PUT' });
      showMsg('✓ User banned');
      loadData();
    } catch (err) {
      showMsg(err.message || 'Failed to ban');
    }
  };

  const unbanUser = async (userId) => {
    try {
      await authFetch(`/admin/unban/${userId}`, { method: 'PUT' });
      showMsg('✓ User unbanned');
      loadData();
    } catch (err) {
      showMsg(err.message || 'Failed to unban');
    }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    try {
      await authFetch('/admin/credit', {
        method: 'POST',
        body: JSON.stringify({
          userId: creditForm.userId,
          amount: Number(creditForm.amount),
          reason: creditForm.reason,
        }),
      });
      showMsg(`✓ ₹${creditForm.amount} credited`);
      setCreditForm({ userId: '', amount: '', reason: '' });
    } catch (err) {
      showMsg(err.message);
    }
  };

  const filteredUsers = userSearch
    ? users.filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const tabs = [
    { key: 'analytics', label: '📊 Analytics' },
    { key: 'rooms', label: '🏟️ Contests' },
    { key: 'users', label: '👥 Users' },
    { key: 'live', label: '🔴 Live' },
    { key: 'transactions', label: '💰 Transactions' },
    { key: 'suspicious', label: '⚠️ Suspicious' },
  ];

  if (!adminUnlocked) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-hero flex items-center justify-center px-4">
        <div className="card max-w-sm w-full p-8 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-600/20 flex items-center justify-center mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Admin Access</h2>
          <p className="text-sm text-slate-400 mb-6">Enter the admin password to continue</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword === '1234') {
              setAdminUnlocked(true);
              setAdminPwdError('');
            } else {
              setAdminPwdError('Incorrect password');
            }
          }}>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Password"
              className="input-field w-full mb-3"
              autoFocus
            />
            {adminPwdError && (
              <p className="text-sm text-red-400 mb-3">{adminPwdError}</p>
            )}
            <button type="submit" className="btn-primary w-full">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-hero px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-6">
          Admin <span className="text-gradient-gold">Panel</span>
        </h1>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-slide-down ${
            message.includes('✓') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-navy-800/50 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-gold-500/15 text-gold-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 mx-auto border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Analytics */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Users" value={analytics.usersCount} icon="👥" color="blue" />
                  <StatCard label="Total Rooms" value={analytics.roomsCount} icon="🏟️" color="purple" />
                  <StatCard label="Live Matches" value={analytics.ongoingCount || 0} icon="🔴" color="green" />
                  <StatCard label="Revenue" value={`₹${(analytics.revenue || 0).toLocaleString()}`} icon="📈" color="gold" />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard label="Waiting Rooms" value={analytics.waitingCount || 0} icon="⏳" color="blue" />
                  <StatCard label="Banned Users" value={analytics.bannedCount || 0} icon="🚫" color="purple" />
                  <StatCard label="Transactions" value={analytics.txCount} icon="💰" color="green" />
                </div>

                {/* Manual Credit */}
                <div className="card">
                  <h3 className="text-sm font-bold text-slate-300 mb-4">💳 Manual Prize Distribution</h3>
                  <form onSubmit={handleCredit} className="grid sm:grid-cols-4 gap-3">
                    <input value={creditForm.userId} onChange={(e) => setCreditForm(p => ({...p, userId: e.target.value}))} placeholder="User ID" className="input-field" required />
                    <input type="number" value={creditForm.amount} onChange={(e) => setCreditForm(p => ({...p, amount: e.target.value}))} placeholder="Amount" className="input-field" min={1} required />
                    <input value={creditForm.reason} onChange={(e) => setCreditForm(p => ({...p, reason: e.target.value}))} placeholder="Reason" className="input-field" />
                    <button type="submit" className="btn-primary btn-sm">Credit Wallet</button>
                  </form>
                </div>
              </div>
            )}

            {/* Rooms Management */}
            {activeTab === 'rooms' && (
              <div className="space-y-6 animate-fade-in">
                {/* Create Form */}
                <div className="card">
                  <h3 className="text-sm font-bold text-slate-300 mb-4">➕ Create Contest</h3>
                  <form onSubmit={createContest} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input value={newRoom.roomId} onChange={(e) => setNewRoom(p => ({...p, roomId: e.target.value}))} placeholder="Room ID (auto if empty)" className="input-field" />
                    <input value={newRoom.name} onChange={(e) => setNewRoom(p => ({...p, name: e.target.value}))} placeholder="Name" className="input-field" />
                    <input type="number" value={newRoom.entryFee} onChange={(e) => setNewRoom(p => ({...p, entryFee: e.target.value}))} placeholder="Fee" className="input-field" min={0} />
                    <select value={newRoom.maxPlayers} onChange={(e) => setNewRoom(p => ({...p, maxPlayers: e.target.value}))} className="select-field">
                      <option value={2}>2 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={8}>8 Players</option>
                      <option value={10}>10 Players</option>
                    </select>
                    <select value={newRoom.prizeDistribution} onChange={(e) => setNewRoom(p => ({...p, prizeDistribution: e.target.value}))} className="select-field">
                      <option value="winnerTA">Winner Takes All</option>
                      <option value="top4">Top 4</option>
                    </select>
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-500 mb-1">Start Time</label>
                      <input type="datetime-local" value={newRoom.startTime} onChange={(e) => setNewRoom(p => ({...p, startTime: e.target.value}))} className="input-field" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-500 mb-1">End Time</label>
                      <input type="datetime-local" value={newRoom.endTime} onChange={(e) => setNewRoom(p => ({...p, endTime: e.target.value}))} className="input-field" />
                    </div>
                    <div className="flex items-end">
                       <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? 'Creating...' : 'Create Contest'}</button>
                    </div>
                  </form>
                </div>

                {/* Edit Room Modal */}
                {editingRoom && (
                  <div className="modal-overlay" onClick={() => setEditingRoom(null)}>
                    <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Edit Room: {editingRoom.roomId}</h3>
                        <form onSubmit={editRoom} className="space-y-3">
                          <input value={editingRoom.name} onChange={(e) => setEditingRoom(p => ({...p, name: e.target.value}))} placeholder="Name" className="input-field" />
                          <input type="number" value={editingRoom.entryFee} onChange={(e) => setEditingRoom(p => ({...p, entryFee: e.target.value}))} placeholder="Entry Fee" className="input-field" />
                          <select value={editingRoom.maxPlayers} onChange={(e) => setEditingRoom(p => ({...p, maxPlayers: e.target.value}))} className="select-field">
                            <option value={2}>2P</option><option value={4}>4P</option><option value={8}>8P</option><option value={10}>10P</option>
                          </select>
                          <div className="flex gap-3 mt-4">
                            <button type="button" onClick={() => setEditingRoom(null)} className="btn-secondary flex-1">Cancel</button>
                            <button type="submit" className="btn-primary flex-1">Save</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rooms list */}
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-700/30 text-slate-500">
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Players</th>
                        <th className="text-left py-2 px-3">Fee</th>
                        <th className="text-left py-2 px-3">Prize</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-right py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((r) => (
                        <tr key={r.roomId} className="border-b border-navy-700/10 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3">
                            <p className="font-medium text-white">{r.name || r.roomId}</p>
                            <p className="text-[10px] text-slate-500">{r.roomId}</p>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{r.players?.length}/{r.maxPlayers}</td>
                          <td className="py-2.5 px-3 text-gold-400">₹{r.entryFee}</td>
                          <td className="py-2.5 px-3">
                            <span className={r.prizeDistribution === 'winnerTA' ? 'badge-gold' : 'badge-blue'}>
                              {r.prizeDistribution === 'winnerTA' ? 'WTA' : 'Top4'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`badge ${r.status === 'waiting' ? 'badge-green' : r.status === 'ongoing' ? 'badge-gold' : 'badge-purple'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            {r.status === 'waiting' && (
                              <button onClick={() => setEditingRoom({ ...r })} className="text-sky-400 hover:text-sky-300 text-xs font-medium">
                                Edit
                              </button>
                            )}
                            <button onClick={() => deleteRoom(r.roomId)} className="text-red-400 hover:text-red-300 text-xs font-medium">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-3">
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="input-field max-w-xs"
                  />
                  <span className="text-xs text-slate-500 self-center">{filteredUsers.length} users</span>
                </div>
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-700/30 text-slate-500">
                        <th className="text-left py-2 px-3">Username</th>
                        <th className="text-left py-2 px-3">Wallet</th>
                        <th className="text-left py-2 px-3">ELO</th>
                        <th className="text-left py-2 px-3">Wins</th>
                        <th className="text-left py-2 px-3">Role</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-right py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="border-b border-navy-700/10 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-medium text-white">
                            {u.username}
                            {u.flags?.length > 0 && (
                              <span className="ml-1 text-red-400 text-[10px]">⚠ {u.flags.length}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gold-400">₹{u.wallet}</td>
                          <td className="py-2.5 px-3 text-sky-400 font-bold">{u.elo || 1000}</td>
                          <td className="py-2.5 px-3 text-slate-400">{u.stats?.wins || 0}</td>
                          <td className="py-2.5 px-3"><span className="badge-blue">{u.role}</span></td>
                          <td className="py-2.5 px-3">
                            {u.banned ? (
                              <span className="badge-red">Banned</span>
                            ) : (
                              <span className="badge-green">Active</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            {u.banned ? (
                              <button onClick={() => unbanUser(u._id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">
                                Unban
                              </button>
                            ) : (
                              <button onClick={() => banUser(u._id)} className="text-red-400 hover:text-red-300 text-xs font-medium">
                                Ban
                              </button>
                            )}
                            <button onClick={() => flagUser(u._id)} className="text-yellow-400 hover:text-yellow-300 text-xs font-medium">
                              Flag
                            </button>
                            <button
                              onClick={() => {
                                setCreditForm({ userId: u._id, amount: '', reason: '' });
                                setActiveTab('analytics');
                              }}
                              className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                            >
                              Credit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Live Matches */}
            {activeTab === 'live' && (
              <div className="animate-fade-in">
                {liveMatches.length === 0 ? (
                  <div className="card text-center py-16">
                    <div className="text-5xl mb-4">🏟️</div>
                    <p className="text-slate-400">No live matches right now</p>
                    <p className="text-slate-500 text-sm mt-1">Matches will appear here when players are competing</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMatches.map((m) => (
                      <div key={m.matchId} className="card-hover">
                        <div className="flex items-center justify-between mb-3">
                          <span className="badge-gold">{m.roomName}</span>
                          <span className="badge-green animate-pulse">🔴 Live</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold">
                              {m.player1?.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm text-white font-medium">{m.player1?.username || 'P1'}</span>
                          </div>
                          <span className="text-xs text-slate-500">vs</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">{m.player2?.username || 'P2'}</span>
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 border border-slate-600 flex items-center justify-center text-xs font-bold">
                              {m.player2?.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Round {m.round}</span>
                          <span>{m.moveCount} moves</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-center">
                  <button onClick={loadData} className="btn-secondary btn-sm">↻ Refresh</button>
                </div>
              </div>
            )}

            {/* Transactions */}
            {activeTab === 'transactions' && (
              <div className="card overflow-x-auto animate-fade-in">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-700/30 text-slate-500">
                      <th className="text-left py-2 px-3">User</th>
                      <th className="text-left py-2 px-3">Amount</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Reason</th>
                      <th className="text-left py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 100).map((tx, i) => (
                      <tr key={tx._id || i} className="border-b border-navy-700/10 hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-white">{tx.userId?.username || '—'}</td>
                        <td className={`py-2.5 px-3 font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </td>
                        <td className="py-2.5 px-3"><span className={tx.type === 'credit' ? 'badge-green' : 'badge-red'}>{tx.type}</span></td>
                        <td className="py-2.5 px-3 text-slate-400 capitalize">{tx.reason || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Suspicious Logs */}
            {activeTab === 'suspicious' && (
              <div className="card overflow-x-auto animate-fade-in">
                {suspicious.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-slate-400">No suspicious activity detected</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-700/30 text-slate-500">
                        <th className="text-left py-2 px-3">User</th>
                        <th className="text-left py-2 px-3">Reason</th>
                        <th className="text-left py-2 px-3">Details</th>
                        <th className="text-left py-2 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspicious.map((log, i) => (
                        <tr key={log._id || i} className="border-b border-navy-700/10 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">{log.userId?.username || '—'}</td>
                          <td className="py-2.5 px-3"><span className="badge-red">{log.reason}</span></td>
                          <td className="py-2.5 px-3 text-slate-400 text-xs">{JSON.stringify(log.details)}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{new Date(log.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'from-sky-500/10 to-sky-600/5 border-sky-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    green: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    gold: 'from-gold-500/10 to-gold-600/5 border-gold-500/20',
  };
  const textColors = { blue: 'text-sky-400', purple: 'text-purple-400', green: 'text-emerald-400', gold: 'text-gold-400' };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-black ${textColors[color]}`}>{value}</p>
    </div>
  );
}
