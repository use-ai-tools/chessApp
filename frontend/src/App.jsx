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
import BotGame from './pages/BotGame';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Learn from './pages/Learn';
import Watch from './pages/Watch';
import Community from './pages/Community';

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
  const isRoomPage = location.pathname.startsWith('/room/') || location.pathname.startsWith('/bot');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin/login';
  const { user } = useContext(AuthContext);

  // Backend wake-up ping every 5 min
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://chessapp-6tb1.onrender.com/ping')
        .catch(() => {});
    }, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      {user && !isAuthPage && <Sidebar />}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative pb-20 md:pb-0">
        <Routes>
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/" element={<Protected><Header /><Home /></Protected>} />
          <Route path="/play" element={<Protected><Header /><Home /></Protected>} />
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
          <Route path="/bot" element={<Protected><Header /><BotGame /></Protected>} />
          <Route path="/learn" element={<Protected><Header /><Learn /></Protected>} />
          <Route path="/watch" element={<Protected><Header /><Watch /></Protected>} />
          <Route path="/community" element={<Protected><Header /><Community /></Protected>} />
          <Route path="/room" element={<Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {/* Bottom Nav — show on all protected pages except room/match pages and auth pages */}
        {user && !isRoomPage && !isAuthPage && <BottomNav />}
      </div>
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
