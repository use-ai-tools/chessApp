import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
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
import ChatBot from './components/ChatBot';

const Protected = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/admin/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-navy-950">
        <Routes>
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/" element={<Protected><Header /><Lobby /></Protected>} />
          <Route path="/room/:roomId" element={<Protected><Header /><RoomPage /></Protected>} />
          <Route path="/leaderboard" element={<Protected><Header /><Leaderboard /></Protected>} />
          <Route path="/transactions" element={<Protected><Header /><Transactions /></Protected>} />
          <Route path="/admin" element={<AdminRoute><Header /><AdminPanel /></AdminRoute>} />
          <Route path="/profile" element={<Protected><Header /><Profile /></Protected>} />
          <Route path="/referrals" element={<Protected><Header /><Referrals /></Protected>} />
          <Route path="/tournaments" element={<Protected><Header /><Tournaments /></Protected>} />
          <Route path="/room" element={<Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ChatBot />
      </div>
    </Router>
  );
}

export default App;
