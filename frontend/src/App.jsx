import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveChatProvider, useActiveChat } from './context/ActiveChatContext';
import { MatchPreferencesProvider } from './context/MatchPreferencesContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MatchmakingPage from './pages/MatchmakingPage';
import ChatPage from './pages/ChatPage';
import FriendsPage from './pages/FriendsPage';
import ProfilePage from './pages/ProfilePage';
import ClaimAccountPage from './pages/ClaimAccountPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const RegisteredOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_guest) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { randomRoomId, randomChatEnded, randomPartner, randomInterests } = useActiveChat();

  const isCurrentActiveRoom = randomRoomId && location.pathname.startsWith(`/chat/${randomRoomId}`);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match"
            element={
              <ProtectedRoute>
                <MatchmakingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claim-account"
            element={
              <ProtectedRoute>
                <ClaimAccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <RegisteredOnlyRoute>
                <ProfilePage />
              </RegisteredOnlyRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent floating active chat banner */}
      {!isCurrentActiveRoom && randomRoomId && !randomChatEnded && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 shadow-2xl flex items-center justify-between gap-4 bg-[#0B0F17]/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Active Random Chat Ongoing</p>
                <p className="text-[10px] text-slate-400">Connected with {randomPartner?.display_name || randomPartner?.username}</p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate(`/chat/${randomRoomId}`, {
                  state: {
                    partner: randomPartner,
                    common_interests: randomInterests,
                    isRandomChat: true,
                  },
                })
              }
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Return to Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MatchPreferencesProvider>
          <ActiveChatProvider>
            <AppRoutes />
          </ActiveChatProvider>
        </MatchPreferencesProvider>
      </Router>
    </AuthProvider>
  );
}
