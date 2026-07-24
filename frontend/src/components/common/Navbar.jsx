import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Users, User, LogOut, Compass, Sparkles, Key } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between border-b border-slate-800/60">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300 tracking-tight">
            OmniRoute
          </span>
          <span className="block text-[10px] uppercase font-semibold tracking-widest text-indigo-400">
            Realtime Chat
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-indigo-400" />
                Dashboard
              </Link>
              <Link
                to="/match"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                Find Match
              </Link>
              <Link
                to="/friends"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                Friends
              </Link>

              {user.is_guest && (
                <Link
                  to="/claim-account"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Claim Account
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              {!user.is_guest ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {user.profile?.display_name || user.username}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-xs">
                    G
                  </div>
                  <span className="text-xs font-medium text-amber-200">
                    {user.profile?.display_name || user.username}
                  </span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
