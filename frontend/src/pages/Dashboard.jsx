import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Users, User, Compass, Tag, CheckCircle2, Key, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const interests = user?.profile?.interests || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-900/30 via-slate-900/60 to-violet-900/20 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            {user?.is_guest ? 'Guest Session Active' : 'Online & Ready'}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.profile?.display_name || user?.username}!
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {user?.is_guest
              ? 'Start matching instantly with online strangers or claim your account to keep your friends and chat history forever.'
              : 'Your real-time matchmaking queue is ready. Set your match preferences and start chatting with strangers around the globe instantly.'}
          </p>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Realtime Matchmaking Card */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Start Matching</h2>
              <p className="text-slate-400 text-sm mt-1">
                Enter the real-time queue to match with strangers by gender & interests.
              </p>
            </div>
          </div>
          <Link
            to="/match"
            className="mt-6 w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all text-center block"
          >
            Start Matching Now
          </Link>
        </div>

        {/* Friends & Connections */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Friends</h2>
              <p className="text-slate-400 text-sm mt-1">
                View accepted friends, pending requests, and start direct conversations.
              </p>
            </div>
          </div>
          <Link
            to="/friends"
            className="mt-6 w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-cyan-300 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 transition-all text-center block"
          >
            View Friends List
          </Link>
        </div>

        {/* Claim Account (For Guests) OR My Profile (For Registered Users) */}
        {user?.is_guest ? (
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between group bg-gradient-to-b from-amber-500/10 to-transparent">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Claim Account</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Permanently save your guest data, friends list, messages, and settings.
                </p>
              </div>
            </div>
            <Link
              to="/claim-account"
              className="mt-6 w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25 transition-all text-center block"
            >
              Claim Account Now
            </Link>
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-3xl border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">My Profile</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Update your bio, country, gender, and manage your interest tags.
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="mt-6 w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-slate-300 glass-panel hover:bg-slate-800/80 border border-slate-700 transition-all text-center block"
            >
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      {/* Guest Quick Logout Bar / Active Tags Summary */}
      {user?.is_guest ? (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-white">Guest Session Actions</span>
            <p className="text-xs text-slate-400">
              Ending your session retains your account in the database. Logging back in restores your data.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout Guest
          </button>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Tag className="w-5 h-5 text-indigo-400" />
              <span>Active Interest Tags</span>
            </div>
            <Link to="/profile" className="text-xs text-indigo-400 hover:underline font-medium">
              Manage Tags
            </Link>
          </div>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">
              No interests selected yet. Add interests in your profile to improve matching accuracy.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
