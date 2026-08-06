import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, ShieldCheck, RefreshCw, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Card, Button } from '../ui';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <Card className="w-full max-w-sm p-6 bg-[#14181F] border-white/[0.08] shadow-menu space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#101319] border border-white/10 flex items-center justify-center mx-auto text-[#A66BFF]">
          <Shield className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Are you human?</h2>
          <p className="text-[#9EA4AF] text-xs">
            Please solve the verification challenge below to continue
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#D66B6B]/10 border border-[#D66B6B]/30 text-[#D66B6B] text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-[#101319] border border-white/[0.06] text-center relative">
            <span className="text-2xl font-bold text-[#A66BFF] tracking-widest font-mono">
              {challenge ? challenge.question : 'Loading...'}
            </span>
            <button
              type="button"
              onClick={fetchChallenge}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#9EA4AF] hover:text-white transition-colors cursor-pointer"
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
              className="input text-center font-bold text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="md"
              className="w-1/3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !challenge}
              variant="primary"
              size="md"
              className="flex-1 font-semibold gap-1.5"
            >
              <span>{loading ? 'Verifying...' : 'Verify Answer'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
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
        className={`w-full p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
          isVerified
            ? 'bg-[#7BAA82]/10 border-[#7BAA82]/40 text-[#7BAA82]'
            : 'bg-[#101319] border-white/[0.08] hover:border-white/15 text-[#9EA4AF]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              isVerified
                ? 'bg-[#7BAA82] border-[#7BAA82] text-black'
                : 'border-white/20 bg-[#14181F]'
            }`}
          >
            {isVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <span className="text-xs font-semibold text-white">I am human</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#9EA4AF] font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#A66BFF]" />
          <span>Verification</span>
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
