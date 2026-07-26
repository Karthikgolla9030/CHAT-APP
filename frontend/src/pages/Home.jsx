import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CaptchaModal } from '../components/common/CaptchaWidget';
import { Sparkles, Shield, Zap, UserCheck, LogIn, Heart, ArrowRight, AlertCircle } from 'lucide-react';

const Home = () => {
  const { user, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState('');

  const handleGuestClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setError('');
      setShowCaptcha(true);
    }
  };

  const handleCaptchaSuccess = async (captchaProofToken) => {
    setShowCaptcha(false);
    setLoadingGuest(true);
    setError('');
    try {
      await guestLogin(captchaProofToken);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Guest login failed.');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl text-center space-y-8 relative z-10 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          Instant Real-Time Chat Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
          Connect instantly with strangers who share your{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
            passions.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Start matching as a Guest in seconds, or sign in to your permanent account.
        </p>

        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Guest vs Login/Register Options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-xl mx-auto w-full">
          <button
            onClick={handleGuestClick}
            disabled={loadingGuest}
            className="w-full sm:w-1/2 py-4 px-6 text-base font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.03] flex items-center justify-center gap-3 border border-cyan-400/30"
          >
            <UserCheck className="w-5 h-5 text-cyan-300" />
            {loadingGuest ? 'Generating Session...' : 'Continue as Guest'}
          </button>

          <Link
            to="/login"
            className="w-full sm:w-1/2 py-4 px-6 text-base font-bold text-slate-200 glass-panel hover:bg-slate-800/80 rounded-2xl border border-slate-700/80 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5 text-indigo-400" />
            Login / Sign Up
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero-Latency Matching</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Native WebSocket queue processing matches you instantly with active online users.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-violet-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Shared Interests</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Normalized tag algorithms match you by hobbies like AI, Coding, Gaming, and Music.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Bot Protected</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Human verification check ensures zero spam and real human strangers.
            </p>
          </div>
        </div>
      </div>

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onSuccess={handleCaptchaSuccess}
      />
    </div>
  );
};

export default Home;
