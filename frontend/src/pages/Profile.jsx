import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';

const AVATARS = ['♔', '♕', '♖', '♗', '♘', '♙'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PFP_KEY = 'chess-profile-pic';

function getRankBadge(elo) {
  if (elo >= 2200) return { label: 'Master', color: 'text-red-400 bg-red-500/10', icon: '🏅' };
  if (elo >= 1800) return { label: 'Expert', color: 'text-purple-400 bg-purple-500/10', icon: '💎' };
  if (elo >= 1400) return { label: 'Advanced', color: 'text-sky-400 bg-sky-500/10', icon: '⭐' };
  if (elo >= 1000) return { label: 'Intermediate', color: 'text-amber-400 bg-amber-500/10', icon: '🔷' };
  return { label: 'Beginner', color: 'text-emerald-400 bg-emerald-500/10', icon: '🌱' };
}

export default function Profile() {
  const { user, token, refreshUser } = useContext(AuthContext);
  const { formatShort } = useCurrency();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem(PFP_KEY) || null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProfile(data.user); setStats(data.stats); setSelectedAvatar(data.user.avatar || '♔'); }
    } catch (err) { console.error('Failed to fetch profile', err); } finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // Profile picture upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { showToast('Image too large (max 500KB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      localStorage.setItem(PFP_KEY, dataUrl);
      setProfilePic(dataUrl);
      showToast('✓ Profile picture updated!');
    };
    reader.readAsDataURL(file);
  };

  const removePic = () => {
    localStorage.removeItem(PFP_KEY);
    setProfilePic(null);
    showToast('Profile picture removed');
  };

  // Avatar save
  const handleAvatarSave = async () => {
    if (!selectedAvatar || selectedAvatar === profile?.avatar) return;
    setAvatarSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ avatar: selectedAvatar }) });
      if (res.ok) { setProfile(p => ({ ...p, avatar: selectedAvatar })); refreshUser(); showToast('✓ Avatar updated!'); setShowAvatarModal(false); }
    } catch {} finally { setAvatarSaving(false); }
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

  // Loading skeleton
  if (loading) return (
    <div className="bg-hero w-full overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-700/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-navy-700/50 rounded animate-pulse" />
            <div className="h-3 w-20 bg-navy-700/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-navy-700/30 rounded-xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );
  if (!profile) return null;

  const s = stats || {};
  const elo = typeof profile.elo === 'object' ? profile.elo?.free || 1200 : profile.elo || 1200;
  const rank = getRankBadge(elo);

  return (
    <div className="bg-hero w-full overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-5 md:px-6 md:py-6 space-y-5">

        {/* ── Profile Header Card ── */}
        <div className="bg-navy-800/40 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0 group">
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden ring-2 ring-navy-600/50 group-hover:ring-chess-green/40 transition-all">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl text-white">
                    {profile.avatar || '♔'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-navy-800 border border-navy-600/50 flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-navy-700 transition-all"
                title="Change picture"
              >📷</button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-black text-white truncate">{profile.username}</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online" />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold text-sky-400">{elo} ELO</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${rank.color}`}>{rank.icon} {rank.label}</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-navy-700/20">
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 rounded-lg text-[10px] font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              📷 Change Picture
            </button>
            <button onClick={() => setShowAvatarModal(true)} className="flex-1 py-2 rounded-lg text-[10px] font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              ♔ Default Avatar
            </button>
            {profilePic && (
              <button onClick={removePic} className="py-2 px-3 rounded-lg text-[10px] font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-wider">Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCard icon="🎮" label="Matches" value={s.totalMatches || 0} />
            <StatCard icon="🏆" label="Wins" value={s.wins || 0} accent="emerald" />
            <StatCard icon="💔" label="Losses" value={s.losses || 0} accent="red" />
            <StatCard icon="📊" label="Win Rate" value={`${s.winRate || 0}%`} accent="purple" />
            <StatCard icon="💰" label="Earnings" value={formatShort(s.totalEarnings || 0)} accent="amber" />
            <StatCard icon="🔥" label="Best Streak" value={s.winStreak || 0} accent="orange" />
          </div>
        </div>

        {/* ── Recent Form ── */}
        {s.recentResults && s.recentResults.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-wider">Recent Form</h3>
            <div className="flex gap-1 flex-wrap">
              {s.recentResults.map((r, i) => (
                <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                  r.result === 'W' ? 'bg-emerald-500/15 text-emerald-400' : r.result === 'L' ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-400'
                }`}>{r.result}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Change Password ── */}
        <div className="bg-navy-800/30 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-600 mb-3 uppercase tracking-wider">Security</h3>
          <form onSubmit={handleChangePassword} className="space-y-2">
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field w-full text-xs" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field w-full text-xs" required minLength={4} />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field w-full text-xs" required />
            </div>
            {pwdError && <p className="text-[10px] text-red-400">{pwdError}</p>}
            {pwdMsg && <p className="text-[10px] text-emerald-400">{pwdMsg}</p>}
            <button type="submit" disabled={pwdLoading} className="w-full py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
              {pwdLoading ? 'Changing...' : '🔒 Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Avatar Modal ── */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-navy-800 border border-navy-700/30 rounded-2xl p-5 max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Choose Default Avatar</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {AVATARS.map(piece => (
                <button key={piece} onClick={() => setSelectedAvatar(piece)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all ${
                    selectedAvatar === piece ? 'bg-chess-green/15 ring-2 ring-chess-green/40 scale-105' : 'bg-navy-700/40 hover:bg-navy-700/60'
                  }`}>{piece}</button>
              ))}
            </div>
            <button onClick={handleAvatarSave} disabled={avatarSaving || selectedAvatar === profile.avatar}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedAvatar === profile.avatar ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15'
              }`}>
              {avatarSaving ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-navy-800 border border-navy-700/30 shadow-2xl text-xs font-semibold text-white animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent = 'sky' }) {
  const accents = {
    sky: 'bg-sky-500/[0.06]', emerald: 'bg-emerald-500/[0.06]', red: 'bg-red-500/[0.06]',
    purple: 'bg-purple-500/[0.06]', amber: 'bg-amber-500/[0.06]', orange: 'bg-orange-500/[0.06]',
  };
  const textColors = {
    sky: 'text-sky-400', emerald: 'text-emerald-400', red: 'text-red-400',
    purple: 'text-purple-400', amber: 'text-amber-400', orange: 'text-orange-400',
  };
  return (
    <div className={`${accents[accent]} rounded-xl p-3 border border-navy-700/10`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] text-slate-600 font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-black ${textColors[accent]}`}>{value}</p>
    </div>
  );
}
