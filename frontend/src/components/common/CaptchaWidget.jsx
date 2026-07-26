import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, ShieldCheck, RefreshCw, AlertCircle, ArrowRight, Check } from 'lucide-react';

export const CaptchaModal = ({ isOpen, onSuccess, onClose }) => {
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchChallenge = async () => {
    setError('');
    setAnswer('');
    try {
      const res = await api.get('/auth/captcha/generate/');
      setChallenge(res.data);
    } catch (err) {
      setError('Failed to load CAPTCHA challenge.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChallenge();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !challenge) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/captcha/verify/', {
        answer: answer.trim(),
        timestamp: challenge.timestamp,
        token: challenge.token,
      });

      if (res.data.status === 'verified' && res.data.captcha_proof_token) {
        onSuccess(res.data.captcha_proof_token);
      } else {
        setError('Incorrect CAPTCHA answer. Please try again.');
        fetchChallenge();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect answer. Try again.');
      fetchChallenge();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative space-y-5 text-center">
        {/* Shield Icon matching reference image */}
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-200 shadow-xl">
          <Shield className="w-8 h-8 text-slate-100" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white">Are you human?</h2>
          <p className="text-slate-400 text-xs">
            Please complete the captcha below to continue
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center relative">
            <span className="text-2xl font-black text-indigo-300 tracking-widest font-mono">
              {challenge ? challenge.question : 'Loading...'}
            </span>
            <button
              type="button"
              onClick={fetchChallenge}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Refresh challenge"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div>
            <input
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type answer number..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center font-bold text-white focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white glass-panel border border-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !challenge}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify Answer'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CaptchaCheckbox = ({ isVerified, onVerify }) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (!isVerified) {
      setShowModal(true);
    }
  };

  const handleSuccess = (proofToken) => {
    setShowModal(false);
    onVerify(proofToken);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          isVerified
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              isVerified
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'border-slate-600 bg-slate-950 hover:border-slate-400'
            }`}
          >
            {isVerified && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <span className="text-sm font-semibold">I am human</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>OmniCaptcha</span>
        </div>
      </div>

      <CaptchaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default CaptchaModal;
