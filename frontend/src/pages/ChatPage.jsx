import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveChat } from '../context/ActiveChatContext';
import api from '../services/api';
import {
  Send, SkipForward, Sparkles, Check, CheckCheck,
  MessageSquare, UserPlus, UserCheck, UserX, Clock, Users, XCircle, ArrowLeft
} from 'lucide-react';

// ─────────────────────────────────────────────────
// FriendStatusButton — Lives in the chat header
// Handles all 6 relationship states
// ─────────────────────────────────────────────────
const FriendStatusButton = ({ roomId, partner }) => {
  // States: none | request_sent | request_received | friends | declined | loading
  const [relStatus, setRelStatus] = useState('loading');
  const [requestId, setRequestId] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  // Expose setRelStatus + setRequestId globally so ChatPage can call it from WS events
  useEffect(() => {
    if (partner?.id) {
      window.__friendStateSetters = { setRelStatus, setRequestId, setShowPanel };
    }
    return () => { delete window.__friendStateSetters; };
  }, [partner?.id]);

  // Fetch relationship status on mount
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

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
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
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 animate-pulse">
            <Users className="w-4 h-4 text-slate-400" />
          </span>
        );
      case 'friends':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            Friends ✓
          </span>
        );
      case 'request_sent':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-semibold cursor-default select-none">
            <Clock className="w-3.5 h-3.5" />
            Request Sent
          </span>
        );
      case 'request_received':
        return (
          <button
            onClick={() => setShowPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-xs font-semibold hover:bg-indigo-500/35 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Friend Request
          </button>
        );
      case 'none':
      default:
        return (
          <button
            onClick={() => setShowPanel(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-indigo-600/30 border border-slate-600/50 hover:border-indigo-500/40 transition-all group"
            title="Send Friend Request"
          >
            <UserPlus className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition-colors" />
          </button>
        );
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>
      {renderIcon()}

      {/* Contextual Panel */}
      {showPanel && relStatus !== 'friends' && relStatus !== 'request_sent' && relStatus !== 'loading' && (
        <div className="absolute right-0 top-10 z-50 w-64 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50 p-4 bg-[#0B0F17]/95">
          {relStatus === 'none' && (
            <>
              <p className="text-sm font-semibold text-white mb-1">Add as Friend?</p>
              <p className="text-xs text-slate-400 mb-3">
                Send a friend request to <span className="text-slate-200 font-medium">{partner?.username}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={sendFriendRequest}
                  className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Send Request
                </button>
                <button
                  onClick={() => setShowPanel(false)}
                  className="px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {relStatus === 'request_received' && (
            <>
              <p className="text-sm font-semibold text-white mb-1">Friend Request</p>
              <p className="text-xs text-slate-400 mb-3">
                <span className="text-indigo-300 font-semibold">{partner?.username}</span> wants to connect
              </p>
              <div className="flex gap-2">
                <button
                  onClick={acceptRequest}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={declineRequest}
                  className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Decline
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
// ChatPage Component
// ─────────────────────────────────────────────────
const ChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    randomRoomId,
    randomPartner,
    randomInterests,
    randomMessages,
    randomPartnerTyping,
    randomChatEnded,
    randomWsRef,
    connectRandomRoom,
    handleSkip,
    handleNextMatch,
    setRandomMessages,
    setRandomPartnerTyping,
    setRandomChatEnded,

    friendRoomId,
    friendPartner,
    friendMessages,
    friendPartnerTyping,
    friendChatEnded,
    friendWsRef,
    connectFriendRoom,
    setFriendMessages,
    setFriendPartnerTyping,
    setFriendChatEnded
  } = useActiveChat();

  const [chatType, setChatType] = useState(null); // 'random' | 'friend' | 'loading'
  const [partnerInfo, setPartnerInfo] = useState(location.state?.partner || null);
  const [commonInterests, setCommonInterests] = useState(location.state?.common_interests || []);

  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Determine chat type and fetch room info if missing
  useEffect(() => {
    const resolveChat = async () => {
      setChatType('loading');

      // 1. Explicitly passed in state
      if (location.state?.isFriendChat) {
        setChatType('friend');
        if (location.state.partner) setPartnerInfo(location.state.partner);
        return;
      }
      if (location.state?.isRandomChat) {
        setChatType('random');
        if (location.state.partner) setPartnerInfo(location.state.partner);
        return;
      }

      // 2. Fetch details from backend (handles page refreshes)
      try {
        const res = await api.get(`/chat/rooms/${roomId}/`);
        setPartnerInfo(res.data.partner);
        setChatType(res.data.is_friend_chat ? 'friend' : 'random');
      } catch (err) {
        console.error('Failed to resolve room:', err);
        setChatType(null);
      }
    };

    resolveChat();
  }, [roomId, location.state]);

  // Connect to the appropriate room once chatType and partnerInfo are resolved
  useEffect(() => {
    if (chatType === 'random' && partnerInfo) {
      connectRandomRoom(roomId, partnerInfo, commonInterests);
    } else if (chatType === 'friend' && partnerInfo) {
      connectFriendRoom(roomId, partnerInfo);
    }
  }, [chatType, roomId, partnerInfo, commonInterests]);

  const messages = chatType === 'friend' ? friendMessages : randomMessages;
  const isPartnerTyping = chatType === 'friend' ? friendPartnerTyping : randomPartnerTyping;
  const chatEnded = chatType === 'friend' ? friendChatEnded : randomChatEnded;
  const wsRef = chatType === 'friend' ? friendWsRef : randomWsRef;

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // Handle friend WS event routing if relevant
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
      if (data.new_status === 'friends') {
        setters.setRelStatus('friends');
        setters.setShowPanel(false);
      }
    } else if (type === 'friend_request_declined') {
      if (data.sender_id === user?.id) {
        setters.setRelStatus('none');
      }
    }
  }, [user?.id]);

  // Handle real-time incoming events
  useEffect(() => {
    if (!wsRef.current) return;

    // Attach custom event handlers to hook up to inline friend state changes
    const originalOnMessage = wsRef.current.onmessage;
    wsRef.current.onmessage = (event) => {
      // Call parent logic in ActiveChatContext
      if (originalOnMessage) originalOnMessage(event);

      // Parse and check for inline friendship updates
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'friend_request_received' ||
          data.type === 'friend_status_update' ||
          data.type === 'friend_request_declined'
        ) {
          handleFriendEvent(data.type, data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.onmessage = originalOnMessage;
      }
    };
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
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-85px)] flex flex-col">

      {/* ── Chat Header ── */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between mb-4 gap-3">

        {/* Left: Partner Info */}
        <div className="flex items-center gap-3 min-w-0">
          {chatType === 'friend' && (
            <button
              onClick={() => navigate('/friends')}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all mr-1"
              title="Back to Friends"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-inner">
            {partnerInfo.username?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-white text-base truncate">
              {partnerInfo.display_name || partnerInfo.username}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-xs text-slate-400">
                {chatType === 'friend' ? 'Direct Messages' : 'Connected in Random Chat'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Common Interests */}
        {chatType === 'random' && commonInterests.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-indigo-300 whitespace-nowrap">You both like:</span>
            {commonInterests.slice(0, 3).map((interest, idx) => (
              <span key={idx} className="text-xs text-white font-medium bg-indigo-600/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Right: Friend icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <FriendStatusButton
            roomId={roomId}
            partner={partnerInfo}
          />
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
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    msg.status === 'seen'
                      ? <CheckCheck className="w-3 h-3 text-cyan-400" />
                      : <Check className="w-3 h-3 text-slate-500" />
                  )}
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
          disabled={chatEnded}
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping(true);
          }}
          placeholder={chatEnded ? 'Chat has ended' : 'Type your message...'}
          className="flex-1 px-4 py-3.5 rounded-2xl glass-input text-sm focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={chatEnded || !inputMessage.trim()}
          className="px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* ── Bottom Controls: Skip / Next Match (Only for Random Chat) ── */}
      {chatType === 'random' && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            disabled={chatEnded}
            className="flex-1 py-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            Skip
          </button>
          <button
            onClick={handleNextMatch}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <SkipForward className="w-4 h-4" />
            Next Match
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
