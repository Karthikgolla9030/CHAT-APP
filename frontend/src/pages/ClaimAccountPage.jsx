import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

export default function ClaimAccountPage() {
  const { fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/claim-account/', {
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      await fetchProfile();

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to claim account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 animate-fade-in">
      <div className="text-center mb-6 space-y-2">
        <Badge tone="warning">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D9A441]" />
          <span className="uppercase text-[10px] tracking-wider font-semibold">GUEST DATA CONVERSION</span>
        </Badge>
        <h1 className="text-2xl font-bold text-white tracking-tight">Claim Guest Account</h1>
        <p className="text-xs text-[#9EA4AF] leading-relaxed max-w-xs mx-auto">
          Convert your temporary session into a permanent account. Your friends, messages, and settings will carry over seamlessly.
        </p>
      </div>

      <Card className="p-7 bg-[#14181F] border-white/[0.05] shadow-menu space-y-5">
        {success ? (
          <div className="p-6 rounded-xl bg-[#7BAA82]/15 border border-[#7BAA82]/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#7BAA82] mx-auto" />
            <h3 className="text-base font-semibold text-white">Account Claimed Successfully!</h3>
            <p className="text-xs text-[#7BAA82]">Your account is now permanent. Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-[#D66B6B]/10 border border-[#D66B6B]/30 flex items-center gap-2.5 text-[#D66B6B] text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">New Permanent Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Alex_Official"
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

            <Button
              type="submit"
              disabled={loading}
              variant="amber"
              size="lg"
              className="w-full font-semibold gap-2 mt-2"
            >
              <span>{loading ? 'Claiming Account...' : 'Permanently Claim Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
