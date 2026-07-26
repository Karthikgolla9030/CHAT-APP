import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WS_BASE_URL } from '../utils/constants';
import api from '../services/api';

const ActiveChatContext = createContext(null);

export const useActiveChat = () => useContext(ActiveChatContext);

export const ActiveChatProvider = ({ children }) => {
  const navigate = useNavigate();

  // ─── Random chat session state ──────────────────────────────────────
  const [randomRoomId, setRandomRoomId] = useState(null);
  const [randomPartner, setRandomPartner] = useState(null);
  const [randomInterests, setRandomInterests] = useState([]);
  const [randomMessages, setRandomMessages] = useState([]);
  const [randomPartnerTyping, setRandomPartnerTyping] = useState(false);
  const [randomChatEnded, setRandomChatEnded] = useState(false);
  const randomWsRef = useRef(null);

  // ─── Friend chat session state ───────────────────────────────────────
  const [friendRoomId, setFriendRoomId] = useState(null);
  const [friendPartner, setFriendPartner] = useState(null);
  const [friendMessages, setFriendMessages] = useState([]);
  const [friendPartnerTyping, setFriendPartnerTyping] = useState(false);
  const [friendChatEnded, setFriendChatEnded] = useState(false);
  const friendWsRef = useRef(null);

  // ─── Matchmaking session state ───────────────────────────────────────
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  // sessionId prevents stale match_found events from old WS sessions
  const matchSessionIdRef = useRef(null);
  const matchWsRef = useRef(null);

  // ─── Clear helpers ───────────────────────────────────────────────────
  const clearRandomChat = () => {
    if (randomWsRef.current) {
      randomWsRef.current.close();
      randomWsRef.current = null;
    }
    setRandomRoomId(null);
    setRandomPartner(null);
    setRandomInterests([]);
    setRandomMessages([]);
    setRandomPartnerTyping(false);
    setRandomChatEnded(false);
  };

  const clearFriendChat = () => {
    if (friendWsRef.current) {
      friendWsRef.current.close();
      friendWsRef.current = null;
    }
    setFriendRoomId(null);
    setFriendPartner(null);
    setFriendMessages([]);
    setFriendPartnerTyping(false);
    setFriendChatEnded(false);
  };

  const stopMatchmaking = useCallback(() => {
    if (matchWsRef.current) {
      try { matchWsRef.current.send(JSON.stringify({ type: 'leave_queue' })); } catch (_) {}
      matchWsRef.current.close();
      matchWsRef.current = null;
    }
    matchSessionIdRef.current = null;
    setIsSearching(false);
    setSearchStatus('');
  }, []);

  // ─── Start matchmaking (called from Next Match or MatchmakingPage) ───
  const startMatchmaking = useCallback((prefs) => {
    // Guard: if already searching with open WS, update prefs in-flight
    if (matchWsRef.current && matchWsRef.current.readyState === WebSocket.OPEN) {
      matchWsRef.current.send(JSON.stringify({
        type: 'update_queue_preferences',
        filters: {
          gender: prefs.gender,
          looking_for: prefs.lookingFor,
          interests: prefs.interests,
        },
      }));
      setSearchStatus('Updated — searching with new preferences...');
      return;
    }

    // Close any stale WS before opening a new one
    if (matchWsRef.current) {
      matchWsRef.current.close();
      matchWsRef.current = null;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Generate a session ID to detect and discard stale events
    const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    matchSessionIdRef.current = sessionId;

    setIsSearching(true);
    setSearchStatus('Connecting to matching network...');

    const socketUrl = import.meta.env.PROD
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/match/?token=${token}`
      : `${WS_BASE_URL}/match/?token=${token}`;

    const ws = new WebSocket(socketUrl);
    matchWsRef.current = ws;

    ws.onopen = () => {
      // If cancelled before WS connected, bail out
      if (matchSessionIdRef.current !== sessionId) { ws.close(); return; }
      setSearchStatus('Scanning for compatible strangers...');
      ws.send(JSON.stringify({
        type: 'join_queue',
        filters: {
          gender: prefs.gender,
          looking_for: prefs.lookingFor,
          interests: prefs.interests,
        },
      }));
    };

    ws.onmessage = (event) => {
      // Discard if this session has been superseded
      if (matchSessionIdRef.current !== sessionId) return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'match_found') {
          // Clean up matchmaking state before navigating
          matchWsRef.current = null;
          matchSessionIdRef.current = null;
          setIsSearching(false);
          setSearchStatus('');
          // Also clear any previous random chat session
          clearRandomChat();
          navigate(`/chat/${data.room_id}`, {
            state: {
              partner: data.partner,
              common_interests: data.common_interests,
              isRandomChat: true,
            },
          });
        } else if (data.type === 'queue_joined') {
          setSearchStatus('Looking for your next match...');
        }
      } catch (err) {
        console.error('Matchmaking WS error:', err);
      }
    };

    ws.onerror = () => {
      if (matchSessionIdRef.current !== sessionId) return;
      setSearchStatus('Connection error. Retrying...');
    };

    ws.onclose = () => {
      if (matchSessionIdRef.current !== sessionId) return;
      // Only clear searching state if this was not a deliberate close
      if (matchSessionIdRef.current === sessionId) {
        matchSessionIdRef.current = null;
        setIsSearching(false);
        setSearchStatus('');
      }
    };
  }, [navigate]);

  // ─── Skip: end chat, go to preferences page (deliberate pause, no auto-start) ─
  const handleSkip = () => {
    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      randomWsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
    }
    clearRandomChat();
    stopMatchmaking();
    navigate('/match', { state: { autoStart: false } });
  };

  // ─── Next Match: end chat, immediately start searching using active prefs ──
  // prefs are passed in by the caller (ChatPage reads from MatchPreferencesContext)
  const handleNextMatch = (prefs) => {
    // Guard: prevent double-click while already searching
    if (isSearching) return;

    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      randomWsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
    }
    clearRandomChat();
    startMatchmaking(prefs);
  };

  // ─── Connect to random room ──────────────────────────────────────────
  const connectRandomRoom = async (roomId, partnerData, interests) => {
    if (randomRoomId === roomId) return;

    clearRandomChat();

    setRandomRoomId(roomId);
    setRandomPartner(partnerData);
    setRandomInterests(interests || []);

    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages/`);
      setRandomMessages(res.data);
    } catch (err) {
      console.error('Failed to load random messages:', err);
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socketUrl = import.meta.env.PROD
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/chat/${roomId}/?token=${token}`
      : `${WS_BASE_URL}/chat/${roomId}/?token=${token}`;

    const ws = new WebSocket(socketUrl);
    randomWsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'chat_message') {
          setRandomMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id;
          if (data.message.sender_id !== currentUserId && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'mark_seen', message_id: data.message.id }));
          }
        } else if (data.type === 'typing') {
          setRandomPartnerTyping(data.is_typing);
        } else if (data.type === 'mark_seen') {
          setRandomMessages((prev) =>
            prev.map((msg) => (msg.id === data.message_id ? { ...msg, status: 'seen' } : msg))
          );
        } else if (data.type === 'chat_ended') {
          setRandomChatEnded(true);
        }
      } catch (err) {
        console.error('Error in random WS:', err);
      }
    };
  };

  // ─── Connect to friend room ──────────────────────────────────────────
  const connectFriendRoom = async (roomId, partnerData) => {
    if (friendRoomId === roomId) return;

    clearFriendChat();

    setFriendRoomId(roomId);
    setFriendPartner(partnerData);

    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages/`);
      setFriendMessages(res.data);
    } catch (err) {
      console.error('Failed to load friend messages:', err);
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socketUrl = import.meta.env.PROD
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/chat/${roomId}/?token=${token}`
      : `${WS_BASE_URL}/chat/${roomId}/?token=${token}`;

    const ws = new WebSocket(socketUrl);
    friendWsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'chat_message') {
          setFriendMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id;
          if (data.message.sender_id !== currentUserId && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'mark_seen', message_id: data.message.id }));
          }
        } else if (data.type === 'typing') {
          setFriendPartnerTyping(data.is_typing);
        } else if (data.type === 'mark_seen') {
          setFriendMessages((prev) =>
            prev.map((msg) => (msg.id === data.message_id ? { ...msg, status: 'seen' } : msg))
          );
        } else if (data.type === 'chat_ended') {
          setFriendChatEnded(true);
        }
      } catch (err) {
        console.error('Error in friend WS:', err);
      }
    };
  };

  // ─── Logout: close all sockets ───────────────────────────────────────
  const handleLogoutClear = () => {
    clearRandomChat();
    clearFriendChat();
    stopMatchmaking();
  };

  return (
    <ActiveChatContext.Provider
      value={{
        // Random chat
        randomRoomId,
        randomPartner,
        randomInterests,
        randomMessages,
        randomPartnerTyping,
        randomChatEnded,
        randomWsRef,
        connectRandomRoom,
        clearRandomChat,
        setRandomMessages,
        setRandomPartnerTyping,
        setRandomChatEnded,

        // Friend chat
        friendRoomId,
        friendPartner,
        friendMessages,
        friendPartnerTyping,
        friendChatEnded,
        friendWsRef,
        connectFriendRoom,
        clearFriendChat,
        setFriendMessages,
        setFriendPartnerTyping,
        setFriendChatEnded,

        // Matchmaking
        isSearching,
        searchStatus,
        startMatchmaking,
        stopMatchmaking,
        handleSkip,
        handleNextMatch,

        // Logout
        handleLogoutClear,
      }}
    >
      {children}
    </ActiveChatContext.Provider>
  );
};