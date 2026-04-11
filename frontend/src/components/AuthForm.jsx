import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RESTRICTED_STATES = ['Assam', 'Odisha', 'Telangana', 'Andhra Pradesh', 'Nagaland', 'Sikkim'];
const INDIAN_STATES = [
  '', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function AuthForm({ mode = 'login' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const isRestricted = RESTRICTED_STATES.includes(state);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      if (!ageVerified) {
        setError('You must be 18+ years old to play');
        setLoading(false);
        return;
      }
      if (isRestricted) {
        setError('Real-money gaming is not available in your state');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-chess-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-chess-green to-emerald-600 flex items-center justify-center shadow-xl shadow-chess-green/20 mb-4">
            <span className="text-white text-3xl font-black">♔</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Chess<span className="text-gradient-green">Arena</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            {mode === 'login' ? 'Sign in to compete and win' : 'Create an account and start winning'}
          </p>
        </div>

        <div className="card-glass p-7">
          <h2 className="text-xl font-bold mb-6 text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username" className="input-field" required autoComplete="username" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" className="input-field" required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={4} />
            </div>

            {/* Signup-only fields */}
            {mode === 'signup' && (
              <>
                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className="select-field" required>
                    <option value="">Select your state</option>
                    {INDIAN_STATES.filter(Boolean).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {isRestricted && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Real-money gaming is restricted in {state}</p>
                  )}
                </div>

                {/* Age Verification */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={ageVerified} onChange={(e) => setAgeVerified(e.target.checked)}
                    className="w-5 h-5 rounded border-navy-600 bg-navy-800 text-chess-green mt-0.5 accent-emerald-500" />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    I am <strong className="text-white">18+</strong> years old and agree to the terms of service
                  </span>
                </label>
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="error">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || (mode === 'signup' && (!ageVerified || isRestricted))}
              className="btn-primary w-full btn-lg">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-sm text-center text-slate-400">
            {mode === 'login' ? (
              <>New to Chess Arena?{' '}<Link to="/signup" className="text-chess-green font-semibold hover:text-emerald-300 transition-colors">Create account</Link></>
            ) : (
              <>Already have an account?{' '}<Link to="/login" className="text-chess-green font-semibold hover:text-emerald-300 transition-colors">Sign in</Link></>
            )}
          </div>
        </div>

        {mode === 'signup' && (
          <div className="mt-4 space-y-2">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center animate-slide-up">
              <p className="text-emerald-400 text-sm font-medium">🎁 Get ₹1,000 bonus on signup!</p>
            </div>
            <div className="p-3 rounded-xl bg-navy-800/50 border border-navy-700/20 text-center">
              <p className="text-[10px] text-slate-500">🎯 This is a game of skill. Play responsibly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
