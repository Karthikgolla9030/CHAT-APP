import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CaptchaModal } from '../components/common/CaptchaWidget';
import {
  Zap,
  Users,
  KeyRound,
  User,
  LogOut,
  Shield,
  ArrowRight,
  Sparkles,
  Tags,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge, Avatar } from '../components/ui';

export default function Home() {
  const { user, guestLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState('');

  const interests = user?.profile?.interests || [];
  const displayName = user?.profile?.display_name || user?.username || 'Guest';

  const handleGuestClick = () => {
    if (user) {
      navigate('/match');
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
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Guest login failed.');
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ─────────────────────────────────────────────────
  // Active User / Guest Session View
  // ─────────────────────────────────────────────────
  if (user) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Hero Section Banner */}
        <Card className="relative overflow-hidden p-6 sm:p-8 md:p-10 bg-[#14181F] border-white/[0.05]">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <Badge tone={user.is_guest ? 'warning' : 'success'}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${user.is_guest ? 'bg-[#D9A441]' : 'bg-[#7BAA82] dot-live'}`}
                    aria-hidden="true"
                  />
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    {user.is_guest ? 'GUEST SESSION ACTIVE' : 'USER SESSION ACTIVE'}
                  </span>
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Welcome back,{' '}
                <span className="text-[#A66BFF] font-semibold">{displayName}</span>
              </h1>

              <p className="text-sm text-[#9EA4AF] leading-relaxed max-w-xl">
                {user.is_guest
                  ? 'Start matching instantly with people online right now, or claim your account to keep your data safe.'
                  : 'Set your preferences and join the queue to start talking with someone new.'}
              </p>

              {/* Users Online In-Card Stat Widget */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-4 bg-[#101319] border border-white/[0.06] rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-[#A66BFF]/10 border border-[#A66BFF]/20 flex items-center justify-center text-[#A66BFF]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white leading-none">2,486</div>
                    <div className="text-[11px] text-[#9EA4AF] mt-0.5">users online</div>
                  </div>

                  {/* Sparkline line chart SVG */}
                  <div className="w-24 h-6 ml-2">
                    <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#D97FA6] fill-none" strokeWidth="2" strokeLinecap="round">
                      <path d="M 0,22 Q 15,25 30,15 T 60,18 T 80,8 T 100,12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sleek Orbit Graphic Art */}
            <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_40s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-white/[0.05]" />
                
                <div className="absolute top-4 right-6 w-12 h-12 rounded-full bg-[#D97FA6]/15 border border-[#D97FA6]/30 flex items-center justify-center shadow-lg">
                  <Avatar name="A" size="sm" />
                </div>
                <div className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-[#D9A441]/15 border border-[#D9A441]/30 flex items-center justify-center shadow-lg">
                  <Avatar name="B" size="md" />
                </div>

                <div className="w-20 h-20 rounded-full bg-[#A66BFF]/15 border border-[#A66BFF]/40 flex items-center justify-center backdrop-blur-xs">
                  <Zap className="w-8 h-8 text-[#A66BFF]" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 3-Column Feature Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Card 1: Start Matching */}
          <Card hover className="p-6 flex flex-col justify-between space-y-6 bg-[#14181F] border-white/[0.05]">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#A66BFF]/10 border border-[#A66BFF]/20 flex items-center justify-center text-[#A66BFF]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Start Matching</h2>
                <p className="text-xs text-[#9EA4AF] mt-1.5 leading-relaxed">
                  Enter the real-time queue to match with strangers by gender and interests.
                </p>
              </div>
            </div>

            <Link
              to="/match"
              className="btn btn-primary btn-md w-full justify-between group"
            >
              <span>Start Matching</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Card>

          {/* Card 2: Friends */}
          <Card hover className="p-6 flex flex-col justify-between space-y-6 bg-[#14181F] border-white/[0.05]">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#D97FA6]/10 border border-[#D97FA6]/20 flex items-center justify-center text-[#D97FA6]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Friends</h2>
                <p className="text-xs text-[#9EA4AF] mt-1.5 leading-relaxed">
                  View accepted friends, pending requests, and start direct conversations.
                </p>
              </div>
            </div>

            <Link
              to="/friends"
              className="btn btn-secondary btn-md w-full justify-between group border-[#D97FA6]/30 text-[#D97FA6] hover:bg-[#D97FA6]/10"
            >
              <span>View Friends List</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Card>

          {/* Card 3: Claim Account / Profile */}
          <Card hover className="p-6 flex flex-col justify-between space-y-6 bg-[#14181F] border-white/[0.05]">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/20 flex items-center justify-center text-[#D9A441]">
                {user.is_guest ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  {user.is_guest ? 'Claim Account' : 'Profile Settings'}
                </h2>
                <p className="text-xs text-[#9EA4AF] mt-1.5 leading-relaxed">
                  {user.is_guest
                    ? 'Permanently save your guest data, friends list, messages, and settings.'
                    : 'Manage your profile details, interest tags, and account safety settings.'}
                </p>
              </div>
            </div>

            {user.is_guest ? (
              <Link
                to="/claim-account"
                className="btn btn-amber btn-md w-full justify-between group"
              >
                <span>Claim Account</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                to="/profile"
                className="btn btn-secondary btn-md w-full justify-between group border-[#D9A441]/30 text-[#D9A441] hover:bg-[#D9A441]/10"
              >
                <span>Manage Profile</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </Card>
        </div>

        {/* Guest Session Action Card at Bottom */}
        {user.is_guest && (
          <Card className="p-6 bg-[#14181F] border-white/[0.05]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#D66B6B]/10 border border-[#D66B6B]/20 flex items-center justify-center text-[#D66B6B] flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Guest Session Actions</h3>
                  <p className="text-xs text-[#9EA4AF] mt-1">
                    Ending your session retains your account in the database. Logging back in restores your data.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-danger btn-md gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Logout Guest</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}

        {/* Interest Tags list for registered users */}
        {!user.is_guest && interests.length > 0 && (
          <Card className="p-6 bg-[#14181F] border-white/[0.05]">
            <h3 className="text-sm font-semibold text-white">Active Interest Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {interests.map((tag, idx) => (
                <span key={idx} className="chip chip-active">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // Guest Landing View (Unauthenticated)
  // ─────────────────────────────────────────────────
  return (
    <div className="py-8 sm:py-12 space-y-16 max-w-5xl mx-auto animate-fade-in">
      <div className="space-y-6 text-left">
        <div>
          <Badge tone="accent">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A66BFF] dot-live" />
            <span>REAL-TIME MATCHMAKING NETWORK</span>
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          Talk to someone who <br />
          <span className="text-[#A66BFF]">gets what you&apos;re into.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#9EA4AF] max-w-2xl leading-relaxed">
          ConnectSphere pairs you with people who share your interests for real-time
          conversations. Start as a guest in seconds, or sign in to keep your friends and history.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[#D66B6B]/30 bg-[#D66B6B]/10 px-4 py-3 text-xs text-[#D66B6B]"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGuestClick}
            disabled={loadingGuest}
            className="w-full sm:w-auto font-semibold px-6"
          >
            <span>{loadingGuest ? 'Starting session…' : 'Continue as guest'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Link to="/login" className="btn btn-secondary btn-lg w-full sm:w-auto px-6">
            Sign in
          </Link>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <section className="grid gap-5 sm:grid-cols-3" aria-label="Key features">
        {[
          {
            icon: Zap,
            title: 'Instant matching',
            body: 'A realtime queue connects you with someone who is online right now — no waiting rooms.',
          },
          {
            icon: Tags,
            title: 'Matched on interests',
            body: 'Pick the tags you care about. We pair you with people who picked the same ones.',
          },
          {
            icon: ShieldCheck,
            title: 'People, not bots',
            body: 'A quick human check runs before you join the queue, so every match is a real person.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title} hover className="p-6 bg-[#14181F] border-white/[0.05]">
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-[#101319] flex items-center justify-center text-[#A66BFF]">
              <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
            <p className="mt-2 text-xs text-[#9EA4AF] leading-relaxed">{body}</p>
          </Card>
        ))}
      </section>

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onSuccess={handleCaptchaSuccess}
      />
    </div>
  );
}
