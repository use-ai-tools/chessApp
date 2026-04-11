import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function WalletModal({ onClose }) {
  const { user, token, refreshUser, updateWallet } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');

  // Add money
  const [addAmount, setAddAmount] = useState('');
  const quickAmounts = [50, 100, 200, 500, 1000];

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');

  // Deposit limit
  const [depositLimit, setDepositLimit] = useState(user?.depositLimit || 0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {}
  };

  const showMsg = (msg, type = 'success') => {
    setMessage(msg); setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAddMoney = async (amount) => {
    const amt = amount || parseInt(addAmount);
    if (!amt || amt <= 0) return showMsg('Enter a valid amount', 'error');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/add-money`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateWallet(data.wallet);
      setAddAmount('');
      showMsg(`₹${amt} added successfully! ✅`);
      fetchTransactions();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt < 50) return showMsg('Minimum withdrawal is ₹50', 'error');
    if (!upiId.trim()) return showMsg('Enter your UPI ID', 'error');
    if (amt > (user?.wallet || 0)) return showMsg('Insufficient balance', 'error');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, upiId: upiId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateWallet(data.wallet);
      setWithdrawAmount('');
      setUpiId('');
      showMsg(data.message);
      fetchTransactions();
    } catch (err) {
      showMsg(err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleSetLimit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/set-deposit-limit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: depositLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg(data.message);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '💰' },
    { key: 'add', label: 'Add Money', icon: '➕' },
    { key: 'withdraw', label: 'Withdraw', icon: '🏦' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
           date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate stats
  const totalWon = transactions.filter(t => t.type === 'credit' && t.reason?.startsWith('Won')).reduce((s, t) => s + t.amount, 0);
  const totalLost = transactions.filter(t => t.type === 'debit' && t.reason?.startsWith('Entry')).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-navy-700/30 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-navy-900 text-sm font-bold">₹</span>
            </div>
            Wallet
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Balance */}
        <div className="px-5 py-4 bg-gradient-to-r from-chess-green/10 to-emerald-500/5 border-b border-navy-700/30 flex-shrink-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Available Balance</p>
          <p className="text-3xl font-black text-white">₹{(user?.wallet || 0).toLocaleString()}</p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-emerald-400">↑ Won: ₹{totalWon.toLocaleString()}</span>
            <span className="text-red-400">↓ Spent: ₹{totalLost.toLocaleString()}</span>
          </div>
        </div>

        {message && (
          <div className={`mx-5 mt-3 p-3 rounded-xl text-sm font-medium animate-slide-down ${
            msgType === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>{message}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === t.key ? 'bg-chess-green/15 text-chess-green' : 'text-slate-400 hover:text-white'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('add')}
                  className="p-4 rounded-xl bg-chess-green/10 border border-chess-green/20 hover:bg-chess-green/15 transition-all text-center">
                  <span className="text-2xl mb-1 block">➕</span>
                  <p className="text-sm font-bold text-white">Add Money</p>
                  <p className="text-[10px] text-slate-500">Instant deposit</p>
                </button>
                <button onClick={() => setActiveTab('withdraw')}
                  className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15 transition-all text-center">
                  <span className="text-2xl mb-1 block">🏦</span>
                  <p className="text-sm font-bold text-white">Withdraw</p>
                  <p className="text-[10px] text-slate-500">UPI transfer</p>
                </button>
              </div>

              <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-4">Recent Activity</h4>
              {transactions.slice(0, 5).map((tx, i) => (
                <TxRow key={tx._id || i} tx={tx} formatDate={formatDate} />
              ))}
              {transactions.length > 5 && (
                <button onClick={() => setActiveTab('history')} className="text-xs text-chess-green font-bold hover:underline">
                  View all transactions →
                </button>
              )}
            </div>
          )}

          {/* ═══ ADD MONEY ═══ */}
          {activeTab === 'add' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quick Add</label>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map(amt => (
                    <button key={amt} onClick={() => handleAddMoney(amt)} disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-700/30 text-white font-bold text-sm hover:border-chess-green/30 hover:bg-chess-green/5 transition-all">
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Custom Amount</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                      placeholder="Enter amount" min="1" max="10000"
                      className="input-field pl-8" />
                  </div>
                  <button onClick={() => handleAddMoney()} disabled={loading || !addAmount}
                    className="btn-primary btn-sm whitespace-nowrap">
                    {loading ? '...' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-navy-800/50 border border-navy-700/20 text-xs text-slate-500">
                <p>💡 Max deposit: ₹10,000 per transaction</p>
                <p className="mt-1">🔒 Payments secured via Razorpay</p>
              </div>
            </div>
          )}

          {/* ═══ WITHDRAW ═══ */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Min ₹50" min="50" className="input-field pl-8" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">UPI ID</label>
                <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                  placeholder="yourname@upi" className="input-field" />
              </div>

              <button onClick={handleWithdraw} disabled={loading}
                className="btn-primary w-full">
                {loading ? 'Processing...' : 'Request Withdrawal'}
              </button>

              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                <p>⏱️ Processing time: 24-48 hours</p>
                <p className="mt-1">📋 Min withdrawal: ₹50</p>
                {parseInt(withdrawAmount) > 0 && (
                  <p className="mt-1 text-yellow-300">💰 Net winnings above ₹10,000 are subject to 30% TDS</p>
                )}
              </div>
            </div>
          )}

          {/* ═══ HISTORY ═══ */}
          {activeTab === 'history' && (
            <div className="space-y-2 animate-fade-in">
              {transactions.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-slate-400">No transactions yet</p>
                </div>
              ) : transactions.map((tx, i) => (
                <TxRow key={tx._id || i} tx={tx} formatDate={formatDate} />
              ))}
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Monthly Deposit Limit (Responsible Gaming)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input type="number" value={depositLimit} onChange={e => setDepositLimit(parseInt(e.target.value) || 0)}
                      placeholder="0 = No limit" className="input-field pl-8" />
                  </div>
                  <button onClick={handleSetLimit} className="btn-secondary btn-sm">Set</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Set to 0 to remove limit</p>
              </div>

              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <h4 className="text-sm font-bold text-sky-400 mb-2">🎮 Responsible Gaming</h4>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li>• Set deposit limits to control spending</li>
                  <li>• Take breaks between gaming sessions</li>
                  <li>• Never play with money you can't afford to lose</li>
                  <li>• Contact support if you need help</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxRow({ tx, formatDate }) {
  const isCredit = tx.type === 'credit';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/40 border border-navy-700/10 hover:border-navy-600/20 transition-all">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
      }`}>
        {isCredit ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{tx.reason || 'Transaction'}</p>
        <p className="text-[10px] text-slate-500">{formatDate(tx.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCredit ? '+' : '-'}₹{tx.amount}
        </p>
        {tx.status === 'pending' && (
          <span className="text-[9px] text-yellow-400 font-medium">Pending</span>
        )}
      </div>
    </div>
  );
}
