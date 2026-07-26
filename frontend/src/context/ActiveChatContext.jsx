import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WS_BASE_URL } from '../utils/constants';
import api from '../services/api';

const ActiveChatContext = createContext(null);

export const useActiveChat = () => useContext(ActiveChatContext);

export const ActiveChatProvider = ({ children }) => {
  const navigate = useNavigate();

  // Random chat session state
  const [randomRoomId, setRandomRoomId] = useState(null);
  const [randomPartner, setRandomPartner] = useState(null);
  const [randomInterests, setRandomInterests] = useState([]);
  const [randomMessages, setRandomMessages] = useState([]);
  const [randomPartnerTyping, setRandomPartnerTyping] = useState(false);
  const [randomChatEnded, setRandomChatEnded] = useState(false);
  const randomWsRef = useRef(null);

  // Friend chat session state
  const [friendRoomId, setFriendRoomId] = useState(null);
  const [friendPartner, setFriendPartner] = useState(null);
  const [friendMessages, setFriendMessages] = useState([]);
  const [friendPartnerTyping, setFriendPartnerTyping] = useState(false);
  const [friendChatEnded, setFriendChatEnded] = useState(false);
  const friendWsRef = useRef(null);

  const randomTypingTimeoutRef = useRef(null);
  const friendTypingTimeoutRef = useRef(null);

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

  // Skip random chat
  const handleSkip = () => {
    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      randomWsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
    }
    clearRandomChat();
    navigate('/match', { state: { autoStart: false } });
  };

  // Next match
  const handleNextMatch = () => {
    if (randomWsRef.current && randomWsRef.current.readyState === WebSocket.OPEN) {
      randomWsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
    }
    clearRandomChat();
    navigate('/match', { state: { autoStart: true } });
  };

  // Connect to random room
  const connectRandomRoom = async (roomId, partnerData, interests) => {
    if (randomRoomId === roomId) return; // Already connected to this room

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

  // Connect to friend room
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

  // Clean up all sockets when logging out
  const handleLogoutClear = () => {
    clearRandomChat();
    clearFriendChat();
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
        randomWsRef,
        connectRandomRoom,
        clearRandomChat,
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
        clearFriendChat,
        setFriendMessages,
        setFriendPartnerTyping,
        setFriendChatEnded,

        handleLogoutClear
      }}
    >
      {children}
    </ActiveChatContext.Provider>
  );
};
