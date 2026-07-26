import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CaptchaCheckbox, CaptchaModal } from '../components/common/CaptchaWidget';
import { LogIn, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showGuestCaptcha, setShowGuestCaptcha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!isCaptchaVerified) {
      setError('Please complete the "I am human" verification checkbox before signing in.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    setShowGuestCaptcha(true);
  };

  const handleGuestCaptchaSuccess = async (captchaProofToken) => {
    setShowGuestCaptcha(false);
    setError('');
    setLoading(true);
    try {
      await guestLogin(captchaProofToken, guestNickname);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800 relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            {isGuestMode ? <UserCheck className="w-6 h-6 text-cyan-400" /> : <LogIn className="w-6 h-6 text-indigo-400" />}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isGuestMode ? 'Instant Guest Chat' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isGuestMode ? 'Enter a nickname to chat immediately' : 'Sign in to your OmniRoute account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isGuestMode ? (
          <form onSubmit={handleStandardSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_dev"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none transition-all"
              />
            </div>

            {/* Captcha Checkbox */}
            <CaptchaCheckbox
              isVerified={isCaptchaVerified}
              onVerify={() => setIsCaptchaVerified(true)}
            />

            <button
              type="submit"
              disabled={loading || !isCaptchaVerified}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                isCaptchaVerified
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuestSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nickname (Optional)
              </label>
              <input
                type="text"
                value={guestNickname}
                onChange={(e) => setGuestNickname(e.target.value)}
                placeholder="ShadowChatter"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating session...' : 'Continue as Guest'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsGuestMode(!isGuestMode)}
            className="text-sm font-medium text-cyan-400 hover:underline"
          >
            {isGuestMode ? 'Use account credentials' : 'Try as temporary Guest instead'}
          </button>

          {!isGuestMode && (
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
                Create one now
              </Link>
            </p>
          )}
        </div>
      </div>

      <CaptchaModal
        isOpen={showGuestCaptcha}
        onClose={() => setShowGuestCaptcha(false)}
        onSuccess={handleGuestCaptchaSuccess}
      />
    </div>
  );
};

export default Login;
