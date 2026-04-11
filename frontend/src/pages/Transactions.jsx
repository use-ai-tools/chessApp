import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Transactions() {
  const { token, user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/transactions?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? transactions
    : filter === 'credit' ? transactions.filter(t => t.type === 'credit')
    : transactions.filter(t => t.type === 'debit');

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Stats
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-hero px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">💰 Transaction History</h1>
          <p className="text-sm text-slate-400">All credits and debits in your wallet</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
          <div className="card text-center py-4">
            <p className="text-xs text-slate-500 uppercase">Balance</p>
            <p className="text-xl font-black text-white">₹{(user?.wallet || 0).toLocaleString()}</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-xs text-slate-500 uppercase">Credits</p>
            <p className="text-xl font-black text-emerald-400">+₹{totalCredit.toLocaleString()}</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-xs text-slate-500 uppercase">Debits</p>
            <p className="text-xl font-black text-red-400">-₹{totalDebit.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 mb-4 bg-navy-800/50 rounded-xl p-1">
          {[['all', 'All'], ['credit', '↑ Credits'], ['debit', '↓ Debits']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === k ? 'bg-chess-green/15 text-chess-green' : 'text-slate-400 hover:text-white'
              }`}>{l}</button>
          ))}
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="card text-center py-12">
            <div className="w-8 h-8 mx-auto border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-4xl mb-3 block">📭</span>
            <p className="text-slate-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => (
              <div key={tx._id || i} className="flex items-center gap-3 p-4 rounded-xl bg-navy-800/50 border border-navy-700/20 hover:border-navy-600/30 transition-all animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  tx.type === 'credit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {tx.type === 'credit' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{tx.reason || 'Transaction'}</p>
                  <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-base font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </p>
                  {tx.status === 'pending' && <span className="badge-gold text-[9px]">Pending</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary btn-sm">← Prev</button>
            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary btn-sm">Next →</button>
          </div>
        )}

        {/* TDS Notice */}
        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
          <p className="font-bold mb-1">📋 Tax Deducted at Source (TDS)</p>
          <p className="text-yellow-400/80">Net winnings above ₹10,000 in a financial year are subject to 30% TDS as per Section 194BA of the Income Tax Act.</p>
        </div>
      </div>
    </div>
  );
}
