import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Home from './pages/Home';
import Lobby from './components/Lobby';
import RoomPage from './pages/RoomPage';
import Leaderboard from './components/Leaderboard';
import Transactions from './pages/Transactions';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import Header from './components/Header';
import Profile from './pages/Profile';
import Referrals from './pages/Referrals';
import Tournaments from './pages/Tournaments';
import Notifications from './pages/Notifications';
import Puzzles from './pages/Puzzles';
import BottomNav from './components/BottomNav';

const Protected = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Admin route — only accessible by username 'kabir' (password gate is in AdminPanel itself)
const KabirRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (user.username !== 'kabir') return <Navigate to="/" />;
  return children;
};

function AppContent() {
  const location = useLocation();
  const isRoomPage = location.pathname.startsWith('/room/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin/login';
  const { user } = useContext(AuthContext);

  // Backend wake-up ping every 4 min
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://chessapp-6tb1.onrender.com/ping')
        .catch(() => {});
    }, 240000); // 4 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-navy-950">
      <Routes>
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/signup" element={<AuthForm mode="signup" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/" element={<Protected><Header /><Home /></Protected>} />
        <Route path="/contests" element={<Protected><Header /><Lobby /></Protected>} />
        <Route path="/room/:roomId" element={<Protected><Header /><RoomPage /></Protected>} />
        <Route path="/leaderboard" element={<Protected><Header /><Leaderboard /></Protected>} />
        <Route path="/transactions" element={<Protected><Header /><Transactions /></Protected>} />
        <Route path="/admin" element={<KabirRoute><Header /><AdminPanel /></KabirRoute>} />
        <Route path="/profile" element={<Protected><Header /><Profile /></Protected>} />
        <Route path="/referrals" element={<Protected><Header /><Referrals /></Protected>} />
        <Route path="/tournaments" element={<Protected><Header /><Tournaments /></Protected>} />
        <Route path="/notifications" element={<Protected><Header /><Notifications /></Protected>} />
        <Route path="/puzzles" element={<Protected><Header /><Puzzles /></Protected>} />
        <Route path="/room" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {/* Bottom Nav — show on all protected pages except room/match pages and auth pages */}
      {user && !isRoomPage && !isAuthPage && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
