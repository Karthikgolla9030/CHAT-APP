import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveChat } from '../context/ActiveChatContext';
import { useMatchPreferences } from '../context/MatchPreferencesContext';
import api from '../services/api';
import {
  Send, SkipForward, Sparkles, Check, CheckCheck,
  MessageSquare, UserPlus, UserCheck, UserX, Clock, Users,
  XCircle, ArrowLeft, Sliders, X, Tag, Plus, Radio, Search
} from 'lucide-react';
import { GENDER_CHOICES, LOOKING_FOR_CHOICES, PRESET_INTERESTS } from '../utils/constants';

// ─────────────────────────────────────────────────
// MatchPrefsDrawer — compact slide-in preferences editor
// ─────────────────────────────────────────────────
const MatchPrefsDrawer = ({ isOpen, onClose }) => {
  const { activePrefs, applyPrefs } = useMatchPreferences();
  const { isSearching, startMatchmaking } = useActiveChat();

  const [gender, setGender] = useState(activePrefs.gender);
  const [lookingFor, setLookingFor] = useState(activePrefs.lookingFor);
  const [interests, setInterests] = useState([...activePrefs.interests]);
  const [customTag, setCustomTag] = useState('');
  const [saved, setSaved] = useState(false);

  // Sync when drawer opens
  useEffect(() => {
    if (isOpen) {
      setGender(activePrefs.gender);
      setLookingFor(activePrefs.lookingFor);
      setInterests([...activePrefs.interests]);
      setSaved(false);
    }
  }, [isOpen, activePrefs]);

  const toggleInterest = (tag) => {
    setInterests((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const clean = customTag.trim();
    if (!clean || interests.includes(clean)) return;
    setInterests((prev) => [...prev, clean]);
    setCustomTag('');
  };

  const handleSave = () => {
    const prefs = { gender, lookingFor, interests };
    applyPrefs(prefs);
    setSaved(true);
    // If actively searching, update queue preferences in-flight
    if (isSearching) {
      startMatchmaking(prefs);
    }
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-sm bg-[#0B0F17] border-l border-slate-800 shadow-2xl flex flex-col overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Match Preferences</h3>
              <p className="text-[10px] text-slate-500">Applies to your next match</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none">
              {GENDER_CHOICES.map((c) => (
                <option key={c.value} value={c.value} className="bg-slate-900 text-white">{c.label}</option>
              ))}
            </select>
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Looking For</label>
            <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none">
              {LOOKING_FOR_CHOICES.map((c) => (
                <option key={c.value} value={c.value} className="bg-slate-900 text-white">{c.label}</option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Interests ({interests.length})</span>
            </div>

            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                {interests.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => toggleInterest(tag)} className="hover:text-red-200 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {PRESET_INTERESTS.filter((t) => !interests.includes(t)).map((tag) => (
                <button key={tag} type="button" onClick={() => toggleInterest(tag)} className="glass-panel text-slate-400 border border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-medium transition-all">
                  +{tag}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(e); }}
                placeholder="Custom interest..."
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs focus:outline-none"
              />
              <button type="button" onClick={handleAddCustom} className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />Add
              </button>
            </div>
          </div>

          {isSearching && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
              <p className="text-xs text-amber-300 font-medium">Saving will update your active search instantly.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800">
          {saved ? (
            <div className="w-full py-3.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {isSearching ? 'Search updated!' : 'Saved for next match'}
            </div>
          ) : (
            <button onClick={handleSave} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25">
              {isSearching ? 'Update Active Search' : 'Save for Next Match'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────
// FriendStatusButton — Lives in the chat header
// ─────────────────────────────────────────────────
const FriendStatusButton = ({ roomId, partner }) => {
  const [relStatus, setRelStatus] = useState('loading');
  const [requestId, setRequestId] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (partner?.id) {
      window.__friendStateSetters = { setRelStatus, setRequestId, setShowPanel };
    }
    return () => { delete window.__friendStateSetters; };
  }, [partner?.id]);

  useEffect(() => {
    if (!partner?.id) return;
    api.get(`/friends/relationship/?partner_id=${partner.id}`)
      .then(res => {
        setRelStatus(res.data.status);
        if (res.data.request_id) setRequestId(res.data.request_id);
        if (res.data.status === 'request_received') setShowPanel(true);
      })
      .catch(() => setRelStatus('none'));
  }, [partner?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendFriendRequest = async () => {
    setRelStatus('loading');
    try {
      const res = await api.post('/friends/requests/', { target_user_id: partner.id, room_id: roomId });
      setRelStatus(res.data.status || 'request_sent');
      if (res.data.request_id) setRequestId(res.data.request_id);
    } catch { setRelStatus('none'); }
    setShowPanel(false);
  };

  const acceptRequest = async () => {
    if (!requestId) return;
    setRelStatus('loading');
    try {
      await api.post(`/friends/requests/${requestId}/accept/`, { room_id: roomId });
      setRelStatus('friends');
    } catch { setRelStatus('request_received'); }
    setShowPanel(false);
  };

  const declineRequest = async () => {
    if (!requestId) return;
    setRelStatus('loading');
    try {
      await api.post(`/friends/requests/${requestId}/reject/`, { room_id: roomId });
      setRelStatus('none');
    } catch { setRelStatus('request_received'); }
    setShowPanel(false);
  };

  const renderIcon = () => {
    switch (relStatus) {
      case 'loading':
        return <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 animate-pulse"><Users className="w-4 h-4 text-slate-400" /></span>;
      case 'friends':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"><UserCheck className="w-3.5 h-3.5" />Friends ✓</span>;
      case 'request_sent':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-semibold cursor-default select-none"><Clock className="w-3.5 h-3.5" />Request Sent</span>;
      case 'request_received':
        return (
          <button onClick={() => setShowPanel(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-xs font-semibold hover:bg-indigo-500/35 transition-all">
            <UserPlus className="w-3.5 h-3.5" />Friend Request
          </button>
        );
      case 'none':
      default:
        return (
          <button onClick={() => setShowPanel(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-indigo-600/30 border border-slate-600/50 hover:border-indigo-500/40 transition-all group" title="Send Friend Request">
            <UserPlus className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition-colors" />
          </button>
        );
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>
      {renderIcon()}
      {showPanel && relStatus !== 'friends' && relStatus !== 'request_sent' && relStatus !== 'loading' && (
        <div className="absolute right-0 top-10 z-50 w-64 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50 p-4 bg-[#0B0F17]/95">
          {relStatus === 'none' && (
            <>
              <p className="text-sm font-semibold text-white mb-1">Add as Friend?</p>
              <p className="text-xs text-slate-400 mb-3">Send a friend request to <span className="text-slate-200 font-medium">{partner?.username}</span></p>
              <div className="flex gap-2">
                <button onClick={sendFriendRequest} className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />Send Request
                </button>
                <button onClick={() => setShowPanel(false)} className="px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-all">Cancel</button>
              </div>
            </>
          )}
          {relStatus === 'request_received' && (
            <>
              <p className="text-sm font-semibold text-white mb-1">Friend Request</p>
              <p className="text-xs text-slate-400 mb-3"><span className="text-indigo-300 font-semibold">{partner?.username}</span> wants to connect</p>
              <div className="flex gap-2">
                <button onClick={acceptRequest} className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />Accept
                </button>
                <button onClick={declineRequest} className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />Decline
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────
// SearchingOverlay — shown while isSearching is true in random chat
// ─────────────────────────────────────────────────
const SearchingOverlay = ({ onOpenPrefs, onCancel }) => {
  const { searchStatus, isSearching } = useActiveChat();
  const { activePrefs } = useMatchPreferences();

  if (!isSearching) return null;

  return (
    <div className="flex flex-col items-center gap-4 p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/25 backdrop-blur-sm animate-fade-in">
      {/* Animated search icon */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-ping" />
          <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Search className="w-4 h-4 text-indigo-300" />
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Finding your next match...</p>
          <p className="text-xs text-slate-400">{searchStatus || 'Scanning the network'}</p>
        </div>
      </div>

      {/* Active interests */}
      {activePrefs.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {activePrefs.interests.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onOpenPrefs}
          className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:border-indigo-500/40 bg-slate-800/60 hover:bg-indigo-600/10 text-slate-300 hover:text-indigo-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />Adjust Preferences
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />Cancel Search
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────
// ChatPage Component
// ─────────────────────────────────────────────────
const ChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePrefs } = useMatchPreferences();

  const {
    randomRoomId, randomPartner, randomInterests, randomMessages,
    randomPartnerTyping, randomChatEnded, randomWsRef,
    connectRandomRoom, handleSkip, handleNextMatch,
    setRandomMessages, setRandomPartnerTyping, setRandomChatEnded,
    isSearching, stopMatchmaking,

    friendRoomId, friendPartner, friendMessages,
    friendPartnerTyping, friendChatEnded, friendWsRef,
    connectFriendRoom, setFriendMessages, setFriendPartnerTyping, setFriendChatEnded,
  } = useActiveChat();

  const [chatType, setChatType] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(location.state?.partner || null);
  const [commonInterests, setCommonInterests] = useState(location.state?.common_interests || []);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    const resolveChat = async () => {
      setChatType('loading');
      if (location.state?.isFriendChat) {
        setChatType('friend');
        if (location.state.partner) setPartnerInfo(location.state.partner);
        return;
      }
      if (location.state?.isRandomChat) {
        setChatType('random');
        if (location.state.partner) setPartnerInfo(location.state.partner);
        if (location.state.common_interests) setCommonInterests(location.state.common_interests);
        return;
      }
      try {
        const res = await api.get(`/chat/rooms/${roomId}/`);
        setPartnerInfo(res.data.partner);
        setChatType(res.data.is_friend_chat ? 'friend' : 'random');
      } catch {
        setChatType(null);
      }
    };
    resolveChat();
  }, [roomId, location.state]);

  useEffect(() => {
    if (chatType === 'random' && partnerInfo) {
      connectRandomRoom(roomId, partnerInfo, commonInterests);
    } else if (chatType === 'friend' && partnerInfo) {
      connectFriendRoom(roomId, partnerInfo);
    }
  }, [chatType, roomId, partnerInfo]);

  const messages = chatType === 'friend' ? friendMessages : randomMessages;
  const isPartnerTyping = chatType === 'friend' ? friendPartnerTyping : randomPartnerTyping;
  const chatEnded = chatType === 'friend' ? friendChatEnded : randomChatEnded;
  const wsRef = chatType === 'friend' ? friendWsRef : randomWsRef;

  useEffect(() => { scrollToBottom(); }, [messages, isPartnerTyping]);

  const handleFriendEvent = useCallback((type, data) => {
    const setters = window.__friendStateSetters;
    if (!setters) return;
    if (type === 'friend_request_received') {
      if (data.receiver_id === user?.id) {
        setters.setRelStatus('request_received');
        setters.setRequestId(data.request_id);
        setters.setShowPanel(true);
      }
    } else if (type === 'friend_status_update') {
      if (data.new_status === 'friends') { setters.setRelStatus('friends'); setters.setShowPanel(false); }
    } else if (type === 'friend_request_declined') {
      if (data.sender_id === user?.id) setters.setRelStatus('none');
    }
  }, [user?.id]);

  useEffect(() => {
    if (!wsRef.current) return;
    const originalOnMessage = wsRef.current.onmessage;
    wsRef.current.onmessage = (event) => {
      if (originalOnMessage) originalOnMessage(event);
      try {
        const data = JSON.parse(event.data);
        if (['friend_request_received', 'friend_status_update', 'friend_request_declined'].includes(data.type)) {
          handleFriendEvent(data.type, data.data);
        }
      } catch (e) { console.error(e); }
    };
    return () => { if (wsRef.current) wsRef.current.onmessage = originalOnMessage; };
  }, [wsRef.current, handleFriendEvent]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || chatEnded) return;
    wsRef.current.send(JSON.stringify({ type: 'chat_message', message: inputMessage.trim() }));
    setInputMessage('');
    handleTyping(false);
  };

  const handleTyping = (isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || chatEnded) return;
    wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    if (isTyping) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => handleTyping(false), 2000);
    }
  };

  const onNextMatch = () => {
    handleNextMatch(activePrefs);
  };

  const onCancelSearch = () => {
    stopMatchmaking();
    navigate('/dashboard');
  };

  if (chatType === 'loading') {
    return (
      <div className="min-h-[calc(100vh-85px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!chatType || !partnerInfo) {
    return (
      <div className="min-h-[calc(100vh-85px)] flex flex-col items-center justify-center space-y-4">
        <p className="text-slate-400">Failed to connect to this chat room.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <MatchPrefsDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-85px)] flex flex-col">

        {/* ── Chat Header ── */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between mb-4 gap-3">

          {/* Left: Partner Info */}
          <div className="flex items-center gap-3 min-w-0">
            {chatType === 'friend' && (
              <button onClick={() => navigate('/friends')} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all mr-1" title="Back to Friends">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-inner">
              {partnerInfo.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-white text-base truncate">{partnerInfo.display_name || partnerInfo.username}</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs text-slate-400">{chatType === 'friend' ? 'Direct Messages' : 'Connected in Random Chat'}</span>
              </div>
            </div>
          </div>

          {/* Center: Common Interests */}
          {chatType === 'random' && commonInterests.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-indigo-300 whitespace-nowrap">You both like:</span>
              {commonInterests.slice(0, 3).map((interest, idx) => (
                <span key={idx} className="text-xs text-white font-medium bg-indigo-600/30 px-2 py-0.5 rounded-md whitespace-nowrap">{interest}</span>
              ))}
            </div>
          )}

          {/* Right: Action Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preferences icon — only for random chat */}
            {chatType === 'random' && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-violet-600/30 border border-slate-600/50 hover:border-violet-500/40 transition-all group"
                title="Match Preferences"
              >
                <Sliders className="w-4 h-4 text-slate-400 group-hover:text-violet-300 transition-colors" />
              </button>
            )}
            <FriendStatusButton roomId={roomId} partner={partnerInfo} />
          </div>
        </div>

        {/* ── Messages Stream ── */}
        <div className="flex-1 glass-panel p-4 rounded-2xl border border-slate-800 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
              <MessageSquare className="w-10 h-10 text-slate-600" />
              <p className="text-sm">Room ready. Say hello to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-md' : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60'}`}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (msg.status === 'seen' ? <CheckCheck className="w-3 h-3 text-cyan-400" /> : <Check className="w-3 h-3 text-slate-500" />)}
                  </div>
                </div>
              );
            })
          )}
          {isPartnerTyping && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 italic font-medium pt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              {partnerInfo.username} is typing...
            </div>
          )}
          {chatEnded && (
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center text-violet-300 text-xs font-semibold">
              Chat session ended.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ── */}
        <form onSubmit={handleSendMessage} className={`flex gap-2 ${chatType === 'random' ? 'mb-4' : ''}`}>
          <input
            type="text"
            disabled={chatEnded || isSearching}
            value={inputMessage}
            onChange={(e) => { setInputMessage(e.target.value); handleTyping(true); }}
            placeholder={isSearching ? 'Finding next match...' : chatEnded ? 'Chat has ended' : 'Type your message...'}
            className="flex-1 px-4 py-3.5 rounded-2xl glass-input text-sm focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={chatEnded || !inputMessage.trim() || isSearching}
            className="px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* ── Bottom Controls: Skip / Next Match / Searching Overlay ── */}
        {chatType === 'random' && (
          isSearching ? (
            <SearchingOverlay onOpenPrefs={() => setDrawerOpen(true)} onCancel={onCancelSearch} />
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                disabled={chatEnded}
                className="flex-1 py-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />Skip
              </button>
              <button
                onClick={onNextMatch}
                disabled={chatEnded}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <SkipForward className="w-4 h-4" />Next Match
              </button>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default ChatPage;
