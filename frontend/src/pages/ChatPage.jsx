import React, { useState, useEffect, useRef } from 'react';
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
import { Card, Badge, Button, Avatar } from '../components/ui';

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

  useEffect(() => {
    if (isOpen) {
      setGender(activePrefs.gender);
      setLookingFor(activePrefs.lookingFor);
      setInterests([...activePrefs.interests]);
      setSaved(false);
    }
  }, [isOpen, activePrefs]);

  const toggleInterest = (tag) => {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-sm bg-[#101319] border-l border-white/[0.05] shadow-menu flex flex-col overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A66BFF]/10 border border-[#A66BFF]/20 flex items-center justify-center text-[#A66BFF]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Match Preferences</h3>
              <p className="text-[10px] text-[#9EA4AF]">Applies to your next match</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#1A1F28] text-[#9EA4AF] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          <div>
            <label className="label">My Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="input text-xs"
            >
              {GENDER_CHOICES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#14181F] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Looking For</label>
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="input text-xs"
            >
              {LOOKING_FOR_CHOICES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#14181F] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9EA4AF] uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-[#A66BFF]" />
              <span>Interests ({interests.length})</span>
            </div>

            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#14181F] border border-white/[0.05]">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-[#A66BFF]/15 border border-[#A66BFF]/30 text-[#A66BFF] text-xs font-medium flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className="hover:text-white transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {PRESET_INTERESTS.filter((t) => !interests.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className="chip text-[#9EA4AF]"
                >
                  +{tag}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustom(e);
                }}
                placeholder="Custom interest..."
                className="input flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="btn btn-secondary btn-sm gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {isSearching && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/25 text-[#D9A441] text-xs font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
              <span>Saving will update active search instantly.</span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/[0.05]">
          {saved ? (
            <div className="w-full py-3 rounded-xl bg-[#7BAA82]/15 border border-[#7BAA82]/30 text-[#7BAA82] text-xs font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>{isSearching ? 'Search updated!' : 'Saved for next match'}</span>
            </div>
          ) : (
            <Button onClick={handleSave} variant="primary" size="md" className="w-full font-semibold">
              {isSearching ? 'Update Active Search' : 'Save for Next Match'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────
// FriendStatusButton — Lives in chat header
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
    return () => {
      delete window.__friendStateSetters;
    };
  }, [partner?.id]);

  useEffect(() => {
    if (!partner?.id) return;
    api
      .get(`/friends/relationship/?partner_id=${partner.id}`)
      .then((res) => {
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
      const res = await api.post('/friends/requests/', {
        target_user_id: partner.id,
        room_id: roomId,
      });
      setRelStatus(res.data.status || 'request_sent');
      if (res.data.request_id) setRequestId(res.data.request_id);
    } catch {
      setRelStatus('none');
    }
    setShowPanel(false);
  };

  const acceptRequest = async () => {
    if (!requestId) return;
    setRelStatus('loading');
    try {
      await api.post(`/friends/requests/${requestId}/accept/`, { room_id: roomId });
      setRelStatus('friends');
    } catch {
      setRelStatus('request_received');
    }
    setShowPanel(false);
  };

  const declineRequest = async () => {
    if (!requestId) return;
    setRelStatus('loading');
    try {
      await api.post(`/friends/requests/${requestId}/reject/`, { room_id: roomId });
      setRelStatus('none');
    } catch {
      setRelStatus('request_received');
    }
    setShowPanel(false);
  };

  const renderIcon = () => {
    switch (relStatus) {
      case 'loading':
        return (
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1A1F28] animate-pulse">
            <Users className="w-4 h-4 text-[#9EA4AF]" />
          </span>
        );
      case 'friends':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7BAA82]/15 border border-[#7BAA82]/30 text-[#7BAA82] text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" /> Friends ✓
          </span>
        );
      case 'request_sent':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/25 text-[#D9A441] text-xs font-semibold cursor-default">
            <Clock className="w-3.5 h-3.5" /> Request Sent
          </span>
        );
      case 'request_received':
        return (
          <button
            type="button"
            onClick={() => setShowPanel((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A66BFF]/20 border border-[#A66BFF]/40 text-[#A66BFF] text-xs font-semibold hover:bg-[#A66BFF]/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Friend Request
          </button>
        );
      case 'none':
      default:
        return (
          <button
            type="button"
            onClick={() => setShowPanel((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1A1F28] border border-white/10 hover:border-[#A66BFF]/40 transition-all group cursor-pointer"
            title="Send Friend Request"
          >
            <UserPlus className="w-4 h-4 text-[#9EA4AF] group-hover:text-[#A66BFF]" />
          </button>
        );
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>
      {renderIcon()}
      {showPanel &&
        relStatus !== 'friends' &&
        relStatus !== 'request_sent' &&
        relStatus !== 'loading' && (
          <div className="absolute right-0 top-10 z-50 w-64 bg-[#14181F] border border-white/10 rounded-xl shadow-menu p-4">
            {relStatus === 'none' && (
              <>
                <p className="text-sm font-semibold text-white mb-1">Add as Friend?</p>
                <p className="text-xs text-[#9EA4AF] mb-3">
                  Send a friend request to <span className="text-white font-medium">{partner?.username}</span>
                </p>
                <div className="flex gap-2">
                  <Button onClick={sendFriendRequest} variant="primary" size="sm" className="flex-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </Button>
                  <Button onClick={() => setShowPanel(false)} variant="ghost" size="sm">
                    Cancel
                  </Button>
                </div>
              </>
            )}
            {relStatus === 'request_received' && (
              <>
                <p className="text-sm font-semibold text-white mb-1">Friend Request</p>
                <p className="text-xs text-[#9EA4AF] mb-3">
                  <span className="text-[#A66BFF] font-semibold">{partner?.username}</span> wants to connect
                </p>
                <div className="flex gap-2">
                  <Button onClick={acceptRequest} variant="success" size="sm" className="flex-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </Button>
                  <Button onClick={declineRequest} variant="danger" size="sm" className="flex-1">
                    <UserX className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </Button>
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
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#14181F] border border-white/[0.05] animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#A66BFF]/40 animate-ping" />
          <div className="w-8 h-8 rounded-full bg-[#A66BFF]/10 border border-[#A66BFF]/30 flex items-center justify-center">
            <Search className="w-4 h-4 text-[#A66BFF]" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Finding next match...</p>
          <p className="text-xs text-[#9EA4AF]">{searchStatus || 'Scanning network'}</p>
        </div>
      </div>

      {activePrefs.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {activePrefs.interests.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-[#A66BFF]/15 border border-[#A66BFF]/30 text-[#A66BFF] text-[11px] font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 w-full pt-1">
        <Button onClick={onOpenPrefs} variant="secondary" size="sm" className="flex-1">
          <Sliders className="w-3.5 h-3.5" />
          <span>Adjust Preferences</span>
        </Button>
        <Button onClick={onCancel} variant="danger" size="sm" className="flex-1">
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </Button>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePrefs } = useMatchPreferences();

  const {
    randomRoomId, randomPartner, randomInterests, randomMessages,
    randomPartnerTyping, randomChatEnded, partnerDisconnected, randomWsRef,
    connectRandomRoom, sendRandomMessage, handleSkip, handleNextMatch,
    isSearching, stopMatchmaking,
    friendRoomId, friendPartner, friendMessages,
    friendPartnerTyping, friendChatEnded, friendWsRef,
    connectFriendRoom,
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
    console.log(`[FRONTEND_LIFECYCLE] ChatPage mount | Room ID: ${roomId} | Timestamp: ${performance.now().toFixed(2)}ms`);
    return () => {
      console.log(`[FRONTEND_LIFECYCLE] ChatPage unmount | Room ID: ${roomId} | Timestamp: ${performance.now().toFixed(2)}ms`);
    };
  }, [roomId]);

  useEffect(() => {
    const resolveChat = async () => {
      setChatType('loading');

      // 1. Check if this is the active random chat in global ActiveChatContext
      if (randomRoomId && randomRoomId === roomId) {
        setChatType('random');
        if (randomPartner) setPartnerInfo(randomPartner);
        else if (location.state?.partner) setPartnerInfo(location.state.partner);
        if (randomInterests && randomInterests.length > 0) setCommonInterests(randomInterests);
        else if (location.state?.common_interests) setCommonInterests(location.state.common_interests);
        return;
      }

      // 2. Check if this is the active friend chat in global ActiveChatContext
      if (friendRoomId && friendRoomId === roomId) {
        setChatType('friend');
        if (friendPartner) setPartnerInfo(friendPartner);
        else if (location.state?.partner) setPartnerInfo(location.state.partner);
        return;
      }

      // 3. Check explicit route location.state
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

      // 4. Fallback: API check
      try {
        const res = await api.get(`/chat/rooms/${roomId}/`);
        setPartnerInfo(res.data.partner);
        setChatType(res.data.room_type === 'friend' ? 'friend' : 'random');
      } catch {
        setChatType(null);
      }
    };
    resolveChat();
  }, [roomId, location.state, randomRoomId, friendRoomId, randomPartner, friendPartner, randomInterests]);

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

  useEffect(() => {
    scrollToBottom();
    console.log(`[FRONTEND_LIFECYCLE] ChatPage rendered messages | Room ID: ${roomId} | Msg Count: ${messages.length} | Timestamp: ${performance.now().toFixed(2)}ms`);
  }, [messages, isPartnerTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    console.log(`[FRONTEND_ACTION] handleSendMessage submit | Timestamp: ${performance.now().toFixed(2)}ms`);
    if (!inputMessage.trim() || chatEnded) return;
    const text = inputMessage.trim();
    setInputMessage('');
    handleTyping(false);

    if (chatType === 'random') {
      sendRandomMessage(text);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat_message', message: text }));
    }
  };

  const handleTyping = (isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || chatEnded) return;
    try {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    } catch (_) {}
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
    navigate('/match');
  };

  if (chatType === 'loading') {
    return (
      <div className="min-h-[calc(100vh-85px)] flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#A66BFF] animate-spin" />
      </div>
    );
  }

  if (!chatType || !partnerInfo) {
    return (
      <div className="min-h-[calc(100vh-85px)] flex flex-col items-center justify-center space-y-4">
        <p className="text-xs text-[#9EA4AF]">Failed to connect to this chat room.</p>
        <Button onClick={() => navigate('/match')} variant="primary" size="sm">
          Find a Match
        </Button>
      </div>
    );
  }

  const partnerName = partnerInfo.display_name || partnerInfo.username;

  return (
    <>
      <MatchPrefsDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-fade-in">
        {/* Chat Header */}
        <Card className="p-4 bg-[#14181F] border-white/[0.05] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {chatType === 'friend' && (
              <button
                type="button"
                onClick={() => navigate('/friends')}
                className="p-1.5 rounded-lg hover:bg-[#1A1F28] text-[#9EA4AF] hover:text-white transition-colors cursor-pointer"
                title="Back to Friends"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Avatar name={partnerName} size="md" online />
            <div className="min-w-0">
              <h2 className="font-semibold text-white text-sm truncate">{partnerName}</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7BAA82]" />
                <span className="text-[11px] text-[#9EA4AF]">
                  {chatType === 'friend' ? 'Direct Message' : 'Live Match Room'}
                </span>
              </div>
            </div>
          </div>

          {/* Common Interests */}
          {chatType === 'random' && commonInterests.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#A66BFF]/10 px-3 py-1 rounded-full border border-[#A66BFF]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#A66BFF]" />
              <span className="text-xs text-[#A66BFF] font-medium">Shared:</span>
              {commonInterests.slice(0, 3).map((interest, idx) => (
                <span key={idx} className="text-xs text-white bg-[#A66BFF]/20 px-2 py-0.5 rounded-md">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {chatType === 'random' && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1A1F28] border border-white/10 hover:border-[#A66BFF]/40 transition-colors text-[#9EA4AF] hover:text-white cursor-pointer"
                title="Match Preferences"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
            <FriendStatusButton roomId={roomId} partner={partnerInfo} />
          </div>
        </Card>

        {/* Messages Stream */}
        <Card className="flex-1 p-4 bg-[#14181F] border-white/[0.05] overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-[#9EA4AF]">
              <MessageSquare className="w-8 h-8 text-[#9EA4AF]/40" />
              <p className="text-xs">Room connected. Say hello to start chatting!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#A66BFF] text-white rounded-br-none'
                        : 'bg-[#1A1F28] text-[#F4F5F7] border border-white/[0.05] rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-[#9EA4AF]">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe &&
                      (msg.status === 'seen' ? (
                        <CheckCheck className="w-3 h-3 text-[#7BAA82]" />
                      ) : (
                        <Check className="w-3 h-3 text-[#9EA4AF]" />
                      ))}
                  </div>
                </div>
              );
            })
          )}
          {isPartnerTyping && (
            <div className="flex items-center gap-2 text-xs text-[#A66BFF] italic font-medium pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A66BFF] animate-ping" />
              {partnerName} is typing...
            </div>
          )}
          {partnerDisconnected && !chatEnded && (
            <div className="p-3 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/25 text-center text-[#D9A441] text-xs font-medium animate-pulse flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Partner connection lost. Waiting 30 seconds for reconnection...</span>
            </div>
          )}
          {chatEnded && (
            <div className="p-3 rounded-xl bg-[#D97FA6]/10 border border-[#D97FA6]/20 text-center text-[#D97FA6] text-xs font-medium">
              Chat session has ended.
            </div>
          )}
          <div ref={messagesEndRef} />
        </Card>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            disabled={chatEnded || isSearching}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping(true);
            }}
            placeholder={isSearching ? 'Finding next match...' : chatEnded ? 'Chat has ended' : 'Type your message...'}
            className="input flex-1 h-11"
          />
          <Button
            type="submit"
            disabled={chatEnded || !inputMessage.trim() || isSearching}
            variant="primary"
            size="md"
            className="h-11 px-5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Bottom Controls */}
        {chatType === 'random' &&
          (isSearching ? (
            <SearchingOverlay onOpenPrefs={() => setDrawerOpen(true)} onCancel={onCancelSearch} />
          ) : chatEnded ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/match')}
                variant="secondary"
                size="md"
                className="flex-1 gap-1.5"
              >
                <Sliders className="w-4 h-4" />
                <span>Match Preferences</span>
              </Button>
              <Button
                onClick={onNextMatch}
                variant="primary"
                size="md"
                className="flex-1 gap-1.5"
              >
                <SkipForward className="w-4 h-4" />
                <span>Find Next Match</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSkip}
                variant="danger"
                size="md"
                className="flex-1 gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Skip</span>
              </Button>
              <Button
                onClick={onNextMatch}
                variant="primary"
                size="md"
                className="flex-1 gap-1.5"
              >
                <SkipForward className="w-4 h-4" />
                <span>Next Match</span>
              </Button>
            </div>
          ))}
      </div>
    </>
  );
}
