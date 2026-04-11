import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function JoinModal({ room, onConfirm, onClose, loading }) {
  const { user } = useContext(AuthContext);

  if (!room) return null;

  const prizePool = room.entryFee * room.maxPlayers;
  const hasBalance = (user?.wallet || 0) >= room.entryFee;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-navy-700/50 bg-gradient-to-r from-gold-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Join Contest</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-navy-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Contest info */}
          <div className="bg-navy-900/50 rounded-xl p-4 border border-navy-700/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Contest</span>
              <span className="text-white font-semibold">{room.name || room.roomId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Prize Pool</span>
              <span className="text-gold-400 font-bold text-lg">₹{prizePool.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Players</span>
              <span className="text-white font-medium">{room.players?.length || 0}/{room.maxPlayers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Prize Type</span>
              <span className={`badge ${room.prizeDistribution === 'winnerTA' ? 'badge-gold' : 'badge-blue'}`}>
                {room.prizeDistribution === 'winnerTA' ? '🏆 Winner Takes All' : '🎯 Top 4'}
              </span>
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-navy-900/50 rounded-xl p-4 border border-navy-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">Entry Fee</span>
              <span className="text-white font-bold">₹{room.entryFee}</span>
            </div>
            <div className="border-t border-navy-700/30 pt-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Your Balance</span>
              <span className={`font-bold ${hasBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                ₹{(user?.wallet || 0).toLocaleString()}
              </span>
            </div>
            {!hasBalance && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-medium">
                  ⚠️ Insufficient balance. You need ₹{room.entryFee - (user?.wallet || 0)} more.
                  Add money to your wallet first.
                </p>
              </div>
            )}
          </div>

          {/* After join balance */}
          {hasBalance && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <span className="text-emerald-400 text-sm">Balance after joining</span>
              <span className="text-emerald-400 font-bold">
                ₹{((user?.wallet || 0) - room.entryFee).toLocaleString()}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!hasBalance || loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Joining...
                </span>
              ) : (
                `Pay ₹${room.entryFee} & Join`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
