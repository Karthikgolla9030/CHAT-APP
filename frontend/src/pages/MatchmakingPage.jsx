import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveChat } from '../context/ActiveChatContext';
import { useMatchPreferences } from '../context/MatchPreferencesContext';
import { LOOKING_FOR_CHOICES, GENDER_CHOICES, PRESET_INTERESTS } from '../utils/constants';
import { Sparkles, Sliders, Radio, XCircle, Tag, Plus, X } from 'lucide-react';

const MatchmakingPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isSearching, searchStatus, startMatchmaking, stopMatchmaking } = useActiveChat();
  const { activePrefs, prefsInitialized, applyPrefs } = useMatchPreferences();

  const [gender, setGender] = useState(
    prefsInitialized ? activePrefs.gender : (user?.profile?.gender || 'prefer_not_to_say')
  );
  const [lookingFor, setLookingFor] = useState(
    prefsInitialized ? activePrefs.lookingFor : (user?.profile?.looking_for || 'anyone')
  );
  const [selectedInterests, setSelectedInterests] = useState(
    prefsInitialized ? activePrefs.interests : (user?.profile?.interests || [])
  );
  const [customInterest, setCustomInterest] = useState('');

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    if (!customInterest.trim()) return;
    const clean = customInterest.trim();
    if (!selectedInterests.includes(clean)) {
      setSelectedInterests((prev) => [...prev, clean]);
    }
    setCustomInterest('');
  };

  const startSearch = () => {
    const prefs = { gender, lookingFor, interests: selectedInterests };
    applyPrefs(prefs);
    startMatchmaking(prefs);
  };

  const cancelSearch = () => {
    stopMatchmaking();
  };

  useEffect(() => {
    if (location.state?.autoStart && prefsInitialized) {
      startSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessage = isSearching
    ? (searchStatus || 'Scanning for compatible strangers...')
    : 'Configure preferences and join queue';

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-slate-800 relative z-10 space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Live WebSocket Matchmaking
          </div>
          <h1 className="text-3xl font-extrabold text-white">Find a Chat Partner</h1>
          <p className="text-slate-400 text-sm">{statusMessage}</p>
        </div>

        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {isSearching && (
              <>
                <div className="absolute inset-0 rounded-full border border-indigo-500/40 animate-radar" />
                <div className="absolute inset-0 rounded-full border border-violet-500/30 animate-radar" style={{ animationDelay: '0.8s' }} />
              </>
            )}
            <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isSearching ? 'bg-indigo-600/20 border-indigo-400 shadow-xl shadow-indigo-500/30' : 'bg-slate-900/60 border-slate-700'}`}>
              <Sparkles className={`w-10 h-10 ${isSearching ? 'text-cyan-300 animate-bounce' : 'text-slate-600'}`} />
            </div>
          </div>
        </div>

        {isSearching ? (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {selectedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matching on:</span>
                {selectedInterests.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="text-center">
              <button
                onClick={cancelSearch}
                className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-2 mx-auto"
              >
                <XCircle className="w-5 h-5" />
                Cancel Search
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Match Filters &amp; Preferences</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none">
                  {GENDER_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value} className="bg-slate-900 text-white">{choice.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Looking For</label>
                <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none">
                  {LOOKING_FOR_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value} className="bg-slate-900 text-white">{choice.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Match Interests ({selectedInterests.length} selected)</span>
              </div>

              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-slate-900/60 border border-slate-800">
                  {selectedInterests.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white border border-indigo-400 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20">
                      #{tag}
                      <button type="button" onClick={() => toggleInterest(tag)} className="hover:text-red-200 transition-colors p-0.5 rounded-full hover:bg-indigo-500" title="Remove">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                {PRESET_INTERESTS.filter((tag) => !selectedInterests.includes(tag)).map((tag) => (
                  <button type="button" key={tag} onClick={() => toggleInterest(tag)} className="glass-panel text-slate-400 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition-all">
                    +#{tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomInterest(e); }}
                  placeholder="Add custom interest tag..."
                  className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs focus:outline-none"
                />
                <button type="button" onClick={handleAddCustomInterest} className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all flex items-center gap-1">
                  <Plus className="w-4 h-4" />Add
                </button>
              </div>
            </div>

            <button onClick={startSearch} className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Start Searching Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchmakingPage;
