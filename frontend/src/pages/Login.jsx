import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CaptchaCheckbox, CaptchaModal } from '../components/common/CaptchaWidget';
import { LogIn, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Logo } from '../components/ui';

export default function Login() {
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
      setError('Please complete the "I am human" verification check before signing in.');
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
    <div className="w-full max-w-md px-4 py-12 mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <Link to="/" className="inline-block mb-4">
          <Logo showSubtitle />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {isGuestMode ? 'Instant Guest Chat' : 'Welcome Back'}
        </h1>
        <p className="text-xs text-[#9EA4AF] mt-1.5">
          {isGuestMode ? 'Enter a nickname to chat immediately' : 'Sign in to your ConnectSphere account'}
        </p>
      </div>

      <div className="bg-[#14181F] border border-white/[0.06] p-7 rounded-xl shadow-menu">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#D66B6B]/10 border border-[#D66B6B]/30 flex items-center gap-3 text-[#D66B6B] text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isGuestMode ? (
          <form onSubmit={handleStandardSubmit} className="space-y-4">
            <div>
              <label className="label">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_dev"
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
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
              className="btn btn-primary btn-md w-full justify-center font-semibold mt-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="label">Nickname (Optional)</label>
              <input
                type="text"
                value={guestNickname}
                onChange={(e) => setGuestNickname(e.target.value)}
                placeholder="ShadowChatter"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md w-full justify-center font-semibold mt-2"
            >
              <span>{loading ? 'Creating session...' : 'Continue as Guest'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/[0.05] text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsGuestMode(!isGuestMode)}
            className="text-xs font-medium text-[#A66BFF] hover:underline cursor-pointer"
          >
            {isGuestMode ? 'Use account credentials' : 'Try as temporary Guest instead'}
          </button>

          {!isGuestMode && (
            <p className="text-xs text-[#9EA4AF]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[#A66BFF] font-semibold hover:underline">
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
}
