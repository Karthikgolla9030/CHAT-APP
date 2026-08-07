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
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
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
  const matchSessionIdRef = useRef(null);
  const matchWsRef = useRef(null);

  // ─── Validate Redis active session (never trust stale local state) ──
  const validateActiveSessionWithRedis = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      clearRandomChat();
      return false;
    }
    try {
      const res = await api.get('/chat/active-session/');
      if (!res.data.has_active_session) {
        clearRandomChat();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to validate active session with Redis:', err);
      return false;
    }
  }, []);

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
    setPartnerDisconnected(false);
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
      try {
        matchWsRef.current.send(JSON.stringify({ type: 'leave_queue' }));
      } catch (_) {}
      matchWsRef.current.close();
      matchWsRef.current = null;
    }
    matchSessionIdRef.current = null;
    setIsSearching(false);
    setSearchStatus('');
  }, []);

  // ─── Helper for friend relationship state updates ────────────────────
  const handleFriendSignal = (type, data) => {
    const setters = window.__friendStateSetters;
    if (!setters) return;
    const friendData = data?.data || data;

    if (type === 'friend_request_received') {
      setters.setRelStatus('request_received');
      if (friendData.request_id) setters.setRequestId(friendData.request_id);
      setters.setShowPanel(true);
    } else if (type === 'friend_status_update') {
      if (friendData.new_status === 'friends') {
        setters.setRelStatus('friends');
        setters.setShowPanel(false);
      }
    } else if (type === 'friend_request_declined') {
      setters.setRelStatus('none');
    }
  };

  // ─── Start matchmaking ───────────────────────────────────────────────
  const startMatchmaking = useCallback((prefs) => {
    if (matchWsRef.current && matchWsRef.current.readyState === WebSocket.OPEN) {
      matchWsRef.current.send(
        JSON.stringify({
          type: 'update_queue_preferences',
          filters: {
            gender: prefs.gender,
            looking_for: prefs.lookingFor,
            interests: prefs.interests,
          },
        })
      );
      setSearchStatus('Updated — searching with new preferences...');
      return;
    }

    if (matchWsRef.current) {
      matchWsRef.current.close();
      matchWsRef.current = null;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const sessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
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
      if (matchSessionIdRef.current !== sessionId) {
        ws.close();
        return;
      }
      setSearchStatus('Scanning for compatible strangers...');
      ws.send(
        JSON.stringify({
          type: 'join_queue',
          filters: {
            gender: prefs.gender,
            looking_for: prefs.lookingFor,
            interests: prefs.interests,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      if (matchSessionIdRef.current !== sessionId) return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'match_found') {
          matchWsRef.current = null;
          matchSessionIdRef.current = null;
          setIsSearching(false);
          setSearchStatus('');
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
        } else if (data.type === 'chat_ended') {
          const endedRoomId = data.room_id;
          clearRandomChat();
          if (endedRoomId && window.location.pathname.includes(`/chat/${endedRoomId}`)) {
            navigate('/match');
          }
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
      if (matchSessionIdRef.current === sessionId) {
        matchSessionIdRef.current = null;
        setIsSearching(false);
        setSearchStatus('');
      }
    };
  }, [navigate]);

  const pendingSendQueueRef = useRef([]);

  // ─── Send message in random chat (with auto-connect & queueing) ─────
  const sendRandomMessage = (content) => {
    if (!content || !content.trim()) return;
    const text = content.trim();

    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      randomWsRef.current.send(JSON.stringify({ type: 'chat_message', message: text }));
    } else {
      pendingSendQueueRef.current.push({ type: 'chat_message', message: text });
      if (randomRoomId && (!randomWsRef.current || randomWsRef.current.readyState === WebSocket.CLOSED)) {
        connectRandomRoom(randomRoomId, randomPartner, randomInterests);
      }
    }
  };

  // ─── Skip: end chat, go to preferences page ──────────────────────────
  const handleSkip = async () => {
    const currentRoomId = randomRoomId;
    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      try {
        randomWsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
      } catch (_) {}
    }
    if (currentRoomId) {
      try {
        await api.post(`/chat/rooms/${currentRoomId}/skip/`);
      } catch (_) {}
    }
    clearRandomChat();
    stopMatchmaking();
    navigate('/match', { state: { autoStart: false } });
  };

  // ─── Next Match: end chat, start searching ───────────────────────────
  const handleNextMatch = async (prefs) => {
    if (isSearching) return;
    const currentRoomId = randomRoomId;

    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      try {
        randomWsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
      } catch (_) {}
    }
    if (currentRoomId) {
      try {
        await api.post(`/chat/rooms/${currentRoomId}/skip/`);
      } catch (_) {}
    }
    clearRandomChat();
    startMatchmaking(prefs);
  };

  // ─── Connect to random room ──────────────────────────────────────────
  const connectRandomRoom = async (roomId, partnerData, interests) => {
    if (randomRoomId === roomId) {
      if (partnerData && !randomPartner) setRandomPartner(partnerData);
      if (interests && interests.length > 0 && randomInterests.length === 0) setRandomInterests(interests);
      if (randomWsRef.current && (randomWsRef.current.readyState === WebSocket.OPEN || randomWsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
    } else {
      clearRandomChat();
    }

    setRandomRoomId(roomId);
    if (partnerData) setRandomPartner(partnerData);
    if (interests) setRandomInterests(interests);

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

    ws.onopen = () => {
      // Flush any queued messages that were sent while connecting
      while (pendingSendQueueRef.current.length > 0) {
        const msg = pendingSendQueueRef.current.shift();
        try {
          ws.send(JSON.stringify(msg));
        } catch (e) {
          console.error('Failed to flush queued message:', e);
        }
      }
    };

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
          clearRandomChat();
          if (roomId && window.location.pathname.includes(`/chat/${roomId}`)) {
            navigate('/match');
          }
        } else if (data.type === 'partner_disconnected') {
          setPartnerDisconnected(true);
        } else if (data.type === 'partner_reconnected') {
          setPartnerDisconnected(false);
        } else if (['friend_request_received', 'friend_status_update', 'friend_request_declined'].includes(data.type)) {
          handleFriendSignal(data.type, data);
        }
      } catch (err) {
        console.error('Error in random WS:', err);
      }
    };

    ws.onclose = () => {
      // If session is still supposed to be active and not explicitly ended, attempt auto-reconnect
      if (randomRoomId === roomId && !randomChatEnded) {
        setTimeout(() => {
          if (randomRoomId === roomId && !randomChatEnded) {
            connectRandomRoom(roomId, partnerData, interests);
          }
        }, 1000);
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
        } else if (['friend_request_received', 'friend_status_update', 'friend_request_declined'].includes(data.type)) {
          handleFriendSignal(data.type, data);
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
        randomRoomId,
        randomPartner,
        randomInterests,
        randomMessages,
        randomPartnerTyping,
        randomChatEnded,
        partnerDisconnected,
        randomWsRef,
        connectRandomRoom,
        sendRandomMessage,
        validateActiveSessionWithRedis,
        clearRandomChat,
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
        clearFriendChat,
        setFriendMessages,
        setFriendPartnerTyping,
        setFriendChatEnded,

        isSearching,
        searchStatus,
        startMatchmaking,
        stopMatchmaking,
        handleSkip,
        handleNextMatch,

        handleLogoutClear,
      }}
    >
      {children}
    </ActiveChatContext.Provider>
  );
};