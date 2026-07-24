import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

const CaptchaModal = ({ isOpen, onSuccess, onClose }) => {
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

      if (res.data.status === 'verified') {
        onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Bot Verification</h2>
          <p className="text-slate-400 text-xs">
            Complete this simple check before joining the real-time match queue
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center relative">
            <span className="text-2xl font-black text-indigo-300 tracking-widest font-mono">
              {challenge ? challenge.question : 'Loading...'}
            </span>
            <button
              type="button"
              onClick={fetchChallenge}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Refresh problem"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Your Answer
            </label>
            <input
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter number..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center font-bold text-white focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaptchaModal;
