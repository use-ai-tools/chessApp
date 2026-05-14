import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';

const PIECES = ['♔', '♕', '♖', '♗', '♘', '♙'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Profile() {
  const { user, token, refreshUser } = useContext(AuthContext);
  const { formatShort } = useCurrency();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProfile(data.user); setStats(data.stats); setSelectedAvatar(data.user.avatar || '♔'); }
    } catch (err) { console.error('Failed to fetch profile', err); } finally { setLoading(false); }
  };

  const handleAvatarSave = async () => {
    if (!selectedAvatar || selectedAvatar === profile?.avatar) return;
    setAvatarSaving(true); setAvatarMsg('');
    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ avatar: selectedAvatar }) });
      const data = await res.json();
      if (res.ok) { setAvatarMsg('✓ Updated!'); setProfile((p) => ({ ...p, avatar: selectedAvatar })); refreshUser(); } else { setAvatarMsg(data.message || 'Failed'); }
    } catch { setAvatarMsg('Network error'); } finally { setAvatarSaving(false); setTimeout(() => setAvatarMsg(''), 3000); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwdMsg(''); setPwdError('');
    if (newPassword.length < 4) { setPwdError('Min 4 characters'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Passwords do not match'); return; }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (res.ok) { setPwdMsg('✓ Password changed!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } else { setPwdError(data.message || 'Failed'); }
    } catch { setPwdError('Network error'); } finally { setPwdLoading(false); }
  };

  if (loading) return (<div className="min-h-[calc(100vh-64px)] bg-hero flex items-center justify-center"><div className="w-10 h-10 border-2 border-chess-green border-t-transparent rounded-full animate-spin" /></div>);
  if (!profile) return null;
  const s = stats || {};

  return (
    <div className="bg-hero w-full overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl text-white flex-shrink-0">{profile.avatar || '♔'}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white truncate">{profile.username}</h1>
            <p className="text-slate-600 text-[10px] mt-0.5">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 mt-1 inline-block">ELO {profile.elo}</span>
          </div>
        </div>

        {/* Avatar Picker */}
        <div>
          <h3 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Choose Avatar</h3>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {PIECES.map((piece) => (
              <button key={piece} onClick={() => setSelectedAvatar(piece)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all flex-shrink-0 ${
                  selectedAvatar === piece ? 'bg-chess-green/10 ring-2 ring-chess-green/30 scale-110' : 'bg-white/5 hover:bg-white/10'
                }`}>{piece}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={handleAvatarSave} disabled={avatarSaving || selectedAvatar === profile.avatar}
              className={`btn-primary btn-sm ${selectedAvatar === profile.avatar ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {avatarSaving ? 'Saving...' : 'Save Avatar'}
            </button>
            {avatarMsg && <span className={`text-xs font-medium ${avatarMsg.includes('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{avatarMsg}</span>}
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Your Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <StatBox label="Total Matches" value={s.totalMatches || 0} icon="🎮" color="sky" />
            <StatBox label="Wins" value={s.wins || 0} icon="🏆" color="emerald" />
            <StatBox label="Losses" value={s.losses || 0} icon="💔" color="red" />
            <StatBox label="Win Rate" value={`${s.winRate || 0}%`} icon="📊" color="purple" />
            <StatBox label="Earnings" value={formatShort(s.totalEarnings || 0)} icon="💰" color="gold" />
            <StatBox label="Best Streak" value={s.winStreak || 0} icon="🔥" color="orange" />
          </div>
        </div>

        {/* Recent Form */}
        {s.recentResults && s.recentResults.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Recent Form</h3>
            <div className="flex gap-1.5 flex-wrap">
              {s.recentResults.map((r, i) => (
                <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                  r.result === 'W' ? 'bg-emerald-500/15 text-emerald-400' : r.result === 'L' ? 'bg-red-500/15 text-red-500' : 'bg-slate-500/15 text-slate-400'
                }`}>{r.result}</div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="pt-4 border-t border-navy-800/30">
          <h3 className="text-[10px] font-semibold text-slate-500 mb-3 uppercase tracking-wider">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-2.5">
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field w-full" required />
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field w-full" required minLength={4} />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field w-full" required />
            {pwdError && <p className="text-xs text-red-400">{pwdError}</p>}
            {pwdMsg && <p className="text-xs text-emerald-400">{pwdMsg}</p>}
            <button type="submit" disabled={pwdLoading} className="btn-primary w-full">{pwdLoading ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }) {
  const c = { sky: 'bg-sky-500/8 text-sky-400', emerald: 'bg-emerald-500/8 text-emerald-400', red: 'bg-red-500/8 text-red-400', purple: 'bg-purple-500/8 text-purple-400', gold: 'bg-amber-500/8 text-amber-400', orange: 'bg-orange-500/8 text-orange-400' };
  return (
    <div className={`p-3 rounded-xl ${c[color]}`}>
      {icon && <span className="text-base mb-0.5 block">{icon}</span>}
      <p className="text-[9px] text-slate-600 font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}
