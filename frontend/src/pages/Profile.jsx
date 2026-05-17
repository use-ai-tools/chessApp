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
  const { user, token, refreshUser, logout } = useContext(AuthContext);
  const { formatShort } = useCurrency();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem(PFP_KEY) || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
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
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setStats(data.stats);
        setSelectedAvatar(data.user.avatar || '♔');
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { showToast('Image too large (max 500KB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      localStorage.setItem(PFP_KEY, dataUrl);
      setProfilePic(dataUrl);
      showToast('✓ Profile picture updated');
    };
    reader.readAsDataURL(file);
  };

  const removePic = () => {
    localStorage.removeItem(PFP_KEY);
    setProfilePic(null);
    showToast('Profile picture removed');
  };

  const handleSaveProfile = async () => {
    if (!selectedAvatar || selectedAvatar === profile?.avatar) {
      setShowEditModal(false);
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: selectedAvatar })
      });
      if (res.ok) {
        setProfile(p => ({ ...p, avatar: selectedAvatar }));
        refreshUser();
        showToast('✓ Profile updated');
        setShowEditModal(false);
      }
    } catch {} finally { setEditSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(''); setPwdError('');
    if (!currentPassword) { setPwdError('Current password required'); return; }
    if (newPassword.length < 4) { setPwdError('New password min 4 characters'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Passwords do not match'); return; }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg('✓ Password changed');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        showToast('✓ Password changed');
      } else {
        setPwdError(data.message || 'Failed');
      }
    } catch { setPwdError('Network error'); } finally { setPwdLoading(false); }
  };

  if (loading) return (
    <div className="bg-hero w-full overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-700/40 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-navy-700/40 rounded animate-pulse" />
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
      <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-4" style={{ boxSizing: 'border-box' }}>

        {/* ── Profile Header Card ── */}
        <div className="bg-navy-800/40 border border-navy-700/20 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-2 ring-navy-700/40">
                {profilePic ? (
                  <img src={profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl text-white">
                    {profile.avatar || '♔'}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0 -right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-navy-900" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-black text-white truncate">{profile.username}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold text-sky-400">{elo} ELO</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${rank.color}`}>{rank.icon} {rank.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>

            <button onClick={() => setShowEditModal(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all">
              ✏️ Edit
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCard icon="🎮" label="Matches" value={s.totalMatches || 0} />
            <StatCard icon="🏆" label="Wins" value={s.wins || 0} accent="emerald" />
            <StatCard icon="💔" label="Losses" value={s.losses || 0} accent="red" />
            <StatCard icon="📊" label="Win Rate" value={`${s.winRate || 0}%`} accent="purple" />
            <StatCard icon="💰" label="Earnings" value={formatShort(s.totalEarnings || 0)} accent="amber" />
            <StatCard icon="🔥" label="Streak" value={s.winStreak || 0} accent="orange" />
          </div>
        </div>

        {/* ── Recent Form ── */}
        {s.recentResults && s.recentResults.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Recent Form</h3>
            <div className="flex gap-1 flex-wrap">
              {s.recentResults.map((r, i) => (
                <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                  r.result === 'W' ? 'bg-emerald-500/15 text-emerald-400' :
                  r.result === 'L' ? 'bg-red-500/15 text-red-400' :
                  'bg-slate-500/15 text-slate-400'
                }`}>{r.result}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Change Password ── */}
        <div className="bg-navy-800/40 border border-navy-700/20 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Security</h3>
          <form onSubmit={handleChangePassword} className="space-y-2 w-full">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field w-full text-xs"
              autoComplete="current-password"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field w-full text-xs"
                autoComplete="new-password"
                required
                minLength={4}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field w-full text-xs"
                autoComplete="new-password"
                required
              />
            </div>
            {pwdError && <p className="text-[10px] text-red-400 px-1">{pwdError}</p>}
            {pwdMsg && <p className="text-[10px] text-emerald-400 px-1">{pwdMsg}</p>}
            <button type="submit" disabled={pwdLoading}
              className="w-full py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50">
              {pwdLoading ? 'Changing...' : '🔒 Change Password'}
            </button>
          </form>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={() => { if (window.confirm('Log out of ChessArena?')) logout(); }}
          className="w-full py-3 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-navy-800 border border-navy-700/30 rounded-2xl p-5 max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Profile Picture */}
            <div className="mb-5">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Profile Picture</h4>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-navy-700/40 flex-shrink-0">
                  {profilePic ? (
                    <img src={profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xl text-white">
                      {selectedAvatar || '♔'}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-1">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-slate-300 hover:bg-white/10">📷 Upload</button>
                  {profilePic && (
                    <button onClick={removePic}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">✕</button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {/* Default Avatar */}
            <div className="mb-5">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fallback Avatar</h4>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(piece => (
                  <button key={piece} onClick={() => setSelectedAvatar(piece)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all ${
                      selectedAvatar === piece ? 'bg-chess-green/15 ring-2 ring-chess-green/40' : 'bg-navy-700/30 hover:bg-navy-700/50'
                    }`}>{piece}</button>
                ))}
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={editSaving}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-chess-green to-emerald-600 text-white hover:shadow-md hover:shadow-chess-green/15 transition-all">
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

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
    <div className={`${accents[accent]} rounded-xl p-3 border border-navy-700/10 min-w-0`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider truncate">{label}</span>
      </div>
      <p className={`text-lg font-black ${textColors[accent]} truncate`}>{value}</p>
    </div>
  );
}
