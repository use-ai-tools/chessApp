import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Referrals() {
  const { user } = useContext(AuthContext);

  if (!user) return null;
  const refLink = `${window.location.origin}/signup?ref=${user.referralCode || ''}`;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="w-20 h-20 bg-chess-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🤝</span>
      </div>
      <h1 className="text-4xl font-black text-white mb-2">Invite & Earn</h1>
      <p className="text-slate-400 mb-8">Get ₹10 instantly when a friend signs up using your link.</p>

      <div className="bg-navy-800/50 border border-navy-700/50 p-8 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Invite Link</h3>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            readOnly 
            value={refLink}
            className="flex-1 bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm"
          />
          <button 
            onClick={() => { navigator.clipboard.writeText(refLink); alert('Copied!'); }}
            className="bg-chess-green hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
