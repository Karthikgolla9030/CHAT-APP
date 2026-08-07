import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveChat } from '../context/ActiveChatContext';
import { useMatchPreferences } from '../context/MatchPreferencesContext';
import { LOOKING_FOR_CHOICES, GENDER_CHOICES, PRESET_INTERESTS } from '../utils/constants';
import { Sparkles, Sliders, Radio, XCircle, Tag, Plus, X } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';

export default function MatchmakingPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSearching, searchStatus, startMatchmaking, stopMatchmaking, randomRoomId, randomPartner, randomInterests, randomChatEnded, validateActiveSessionWithRedis } = useActiveChat();
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
    validateActiveSessionWithRedis();
    if (location.state?.autoStart && prefsInitialized) {
      startSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessage = isSearching
    ? (searchStatus || 'Scanning for compatible partners...')
    : 'Configure preferences and join the queue';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Active Session Resume Banner if navigating to /match during live chat */}
      {randomRoomId && !randomChatEnded && (
        <Card className="p-4 bg-[#14181F] border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-[#A66BFF] animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-white">Active session in progress</p>
              <p className="text-[11px] text-[#9EA4AF]">
                Chatting with {randomPartner?.display_name || randomPartner?.username}
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(`/chat/${randomRoomId}`, {
                state: {
                  partner: randomPartner,
                  common_interests: randomInterests,
                  isRandomChat: true,
                },
              })
            }
            variant="primary"
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Resume Chat</span>
          </Button>
        </Card>
      )}

      <div className="text-center space-y-3">
        <Badge tone={isSearching ? 'accent' : 'neutral'}>
          <Radio className={`w-3 h-3 ${isSearching ? 'text-[#A66BFF] dot-live' : 'text-[#9EA4AF]'}`} />
          <span className="uppercase text-[10px] tracking-wider font-semibold">
            {isSearching ? 'LIVE MATCHING IN PROGRESS' : 'MATCHMAKING QUEUE'}
          </span>
        </Badge>

        <h1 className="text-3xl font-bold text-white tracking-tight">Find a Chat Partner</h1>
        <p className="text-xs text-[#9EA4AF] max-w-md mx-auto">{statusMessage}</p>
      </div>

      <Card className="p-8 bg-[#14181F] border-white/[0.05] shadow-menu space-y-8">
        {/* Central Radar Pulse Graphic */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {isSearching && (
              <>
                <div className="absolute inset-0 rounded-full border border-[#A66BFF]/30 animate-ping opacity-30" />
                <div className="absolute inset-3 rounded-full border border-[#D97FA6]/20 animate-pulse" />
              </>
            )}
            <div
              className={`w-24 h-24 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${
                isSearching
                  ? 'bg-[#A66BFF]/15 border-[#A66BFF]/40 text-[#A66BFF]'
                  : 'bg-[#101319] text-[#9EA4AF]'
              }`}
            >
              <Sparkles className={`w-8 h-8 ${isSearching ? 'text-[#A66BFF]' : 'text-[#9EA4AF]'}`} />
            </div>
          </div>
        </div>

        {isSearching ? (
          <div className="space-y-6 pt-4 border-t border-white/[0.05]">
            {selectedInterests.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#9EA4AF] uppercase tracking-wider block">
                  Active Match Tags:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedInterests.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-[#A66BFF]/10 border border-[#A66BFF]/30 text-[#A66BFF] text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center pt-2">
              <Button
                variant="danger"
                size="md"
                onClick={cancelSearch}
                className="mx-auto gap-2 border-[#D66B6B]/40 text-[#D66B6B] hover:bg-[#D66B6B]/10"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Search</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-[#A66BFF]" />
              <span>Match Filters &amp; Preferences</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">My Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input"
                >
                  {GENDER_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value} className="bg-[#14181F] text-white">
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Looking For</label>
                <select
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="input"
                >
                  {LOOKING_FOR_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value} className="bg-[#14181F] text-white">
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9EA4AF] uppercase tracking-wider">
                <Tag className="w-4 h-4 text-[#A66BFF]" />
                <span>Selected Interests ({selectedInterests.length})</span>
              </div>

              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#101319] border border-white/[0.05]">
                  {selectedInterests.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-[#A66BFF]/15 border border-[#A66BFF]/40 text-[#A66BFF] text-xs font-medium flex items-center gap-1.5"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className="hover:text-white p-0.5 rounded-md hover:bg-[#A66BFF]/30 transition-colors"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {PRESET_INTERESTS.filter((tag) => !selectedInterests.includes(tag)).map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className="chip text-[#9EA4AF] hover:text-white hover:border-white/20"
                  >
                    +#{tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomInterest(e);
                  }}
                  placeholder="Add custom interest tag..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomInterest}
                  className="btn btn-secondary btn-md gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <Button
              onClick={startSearch}
              variant="primary"
              size="lg"
              className="w-full font-semibold gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Searching Now</span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
