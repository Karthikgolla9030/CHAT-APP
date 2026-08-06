import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveChatProvider, useActiveChat } from './context/ActiveChatContext';
import { MatchPreferencesProvider } from './context/MatchPreferencesContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MatchmakingPage from './pages/MatchmakingPage';
import ChatPage from './pages/ChatPage';
import FriendsPage from './pages/FriendsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import ClaimAccountPage from './pages/ClaimAccountPage';
import { PageLoader } from './components/ui';
import { Shield } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const RegisteredOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_guest) return <Navigate to="/" replace />;
  return children;
};

function ShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { randomRoomId, randomChatEnded, randomPartner, randomInterests } = useActiveChat();

  const isCurrentActiveRoom = randomRoomId && location.pathname.startsWith(`/chat/${randomRoomId}`);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#0D0F14] text-[#F4F5F7] flex flex-col font-sans">
        <main className="flex-1 flex items-center justify-center">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F14] text-[#F4F5F7] flex flex-col lg:flex-row font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Header */}
        <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Page View Routing */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
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
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
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

        {/* Official Footer */}
        <footer className="border-t border-white/[0.05] py-6 px-6 mt-auto bg-[#0D0F14]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9EA4AF]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#A66BFF]" />
              <span>Your privacy and safety are our priority.</span>
            </div>
            <p>&copy; {new Date().getFullYear()} ConnectSphere. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Persistent Active Chat Floating Banner */}
      {!isCurrentActiveRoom && randomRoomId && !randomChatEnded && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
          <div className="bg-[#14181F] border border-white/10 p-3 pl-4 rounded-xl shadow-menu flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="dot dot-online dot-live" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white leading-tight">Chat in progress</p>
                <p className="text-[11px] text-[#9EA4AF] truncate mt-0.5">
                  with {randomPartner?.display_name || randomPartner?.username}
                </p>
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
              className="btn btn-primary btn-sm flex-shrink-0"
            >
              Return
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
            <ShellLayout />
          </ActiveChatProvider>
        </MatchPreferencesProvider>
      </Router>
    </AuthProvider>
  );
}
