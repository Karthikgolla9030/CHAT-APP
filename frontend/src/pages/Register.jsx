import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CaptchaCheckbox } from '../components/common/CaptchaWidget';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Logo } from '../components/ui';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCaptchaVerified) {
      setError('Please complete the "I am human" verification check before creating an account.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || err.response?.data?.detail || 'Registration failed.';
      setError(msg);
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
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-xs text-[#9EA4AF] mt-1.5">
          Join ConnectSphere for custom profiles, friends, and chat history
        </p>
      </div>

      <div className="bg-[#14181F] border border-white/[0.06] p-7 rounded-xl shadow-menu">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#D66B6B]/10 border border-[#D66B6B]/30 flex items-center gap-3 text-[#D66B6B] text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alex_coder"
              className="input"
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
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
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
          <p className="text-xs text-[#9EA4AF]">
            Already registered?{' '}
            <Link to="/login" className="text-[#A66BFF] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
