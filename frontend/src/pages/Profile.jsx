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

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setStats(data.stats);
        setSelectedAvatar(data.user.avatar || '♔');
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSave = async () => {
    if (!selectedAvatar || selectedAvatar === profile?.avatar) return;
    setAvatarSaving(true);
    setAvatarMsg('');
    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: selectedAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarMsg('✓ Avatar updated!');
        setProfile((p) => ({ ...p, avatar: selectedAvatar }));
        refreshUser();
      } else {
        setAvatarMsg(data.message || 'Failed to update');
      }
    } catch (err) {
      setAvatarMsg('Network error');
    } finally {
      setAvatarSaving(false);
      setTimeout(() => setAvatarMsg(''), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');

    if (newPassword.length < 4) {
      setPwdError('New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg('✓ Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPwdError('Network error');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-hero flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const s = stats || {};

  return (
    <div className="bg-hero px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Header */}
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-4xl text-white shadow-xl shadow-purple-500/20">
              {profile.avatar || '♔'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white">{profile.username}</h1>
              <p className="text-slate-400 text-sm mt-1">
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-blue text-xs">ELO {profile.elo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selector */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
            Choose Avatar
          </h3>
          <div className="flex gap-3 justify-center mb-4">
            {PIECES.map((piece) => (
              <button
                key={piece}
                onClick={() => setSelectedAvatar(piece)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all border-2 ${
                  selectedAvatar === piece
                    ? 'border-chess-green bg-chess-green/10 scale-110 shadow-lg shadow-chess-green/20'
                    : 'border-navy-700/30 bg-navy-800/50 hover:border-navy-600 hover:scale-105'
                }`}
              >
                {piece}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleAvatarSave}
              disabled={avatarSaving || selectedAvatar === profile.avatar}
              className={`btn-primary btn-sm ${
                selectedAvatar === profile.avatar ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {avatarSaving ? 'Saving...' : 'Save Avatar'}
            </button>
            {avatarMsg && (
              <span
                className={`text-sm font-medium ${
                  avatarMsg.includes('✓') ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {avatarMsg}
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
            Your Stats
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Total Matches" value={s.totalMatches || 0} icon="🎮" color="sky" />
            <StatBox label="Wins" value={s.wins || 0} icon="🏆" color="emerald" />
            <StatBox label="Losses" value={s.losses || 0} icon="💔" color="red" />
            <StatBox label="Win Rate" value={`${s.winRate || 0}%`} icon="📊" color="purple" />
            <StatBox
              label="Total Earnings"
              value={formatShort(s.totalEarnings || 0)}
              icon="💰"
              color="gold"
            />
            <StatBox label="Best Streak" value={`🔥 ${s.winStreak || 0}`} icon="" color="orange" />
          </div>
        </div>

        {/* Recent Form */}
        {s.recentResults && s.recentResults.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
              Recent Form
            </h3>
            <div className="flex gap-2 flex-wrap">
              {s.recentResults.map((r, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    r.result === 'W'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : r.result === 'L'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {r.result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
            Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field w-full"
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field w-full"
              required
              minLength={4}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full"
              required
            />
            {pwdError && (
              <p className="text-sm text-red-400 font-medium">{pwdError}</p>
            )}
            {pwdMsg && (
              <p className="text-sm text-emerald-400 font-medium">{pwdMsg}</p>
            )}
            <button
              type="submit"
              disabled={pwdLoading}
              className="btn-primary w-full"
            >
              {pwdLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }) {
  const colors = {
    sky: 'from-sky-500/10 to-sky-600/5 border-sky-500/20 text-sky-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400',
    gold: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400',
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
      {icon && <span className="text-lg mb-1 block">{icon}</span>}
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-black ${colors[color]?.split(' ').pop()}`}>{value}</p>
    </div>
  );
}
