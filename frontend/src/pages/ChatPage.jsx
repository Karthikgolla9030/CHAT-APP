import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WS_BASE_URL } from '../utils/constants';
import api from '../services/api';
import { Send, SkipForward, UserPlus, ShieldAlert, Sparkles, Check, CheckCheck, MessageSquare } from 'lucide-react';

const ChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const partner = location.state?.partner || { username: 'Stranger' };
  const commonInterests = location.state?.common_interests || [];

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !roomId) return;

    const socketUrl = `${WS_BASE_URL}/chat/${roomId}/?token=${token}`;
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat_message') {
        setMessages((prev) => [...prev, data.message]);
        if (data.message.sender_id !== user?.id) {
          // Send mark_seen
          ws.send(JSON.stringify({ type: 'mark_seen', message_id: data.message.id }));
        }
      } else if (data.type === 'typing') {
        setIsPartnerTyping(data.is_typing);
      } else if (data.type === 'mark_seen') {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === data.message_id ? { ...msg, status: 'seen' } : msg))
        );
      } else if (data.type === 'chat_ended') {
        setChatEnded(true);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, user?.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current || chatEnded) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'chat_message',
        message: inputMessage.trim(),
      })
    );

    setInputMessage('');
    handleTyping(false);
  };

  const handleTyping = (isTyping) => {
    if (!wsRef.current || chatEnded) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'typing',
        is_typing: isTyping,
      })
    );

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => handleTyping(false), 2000);
    }
  };

  const handleSkipChat = () => {
    if (wsRef.current && !chatEnded) {
      wsRef.current.send(JSON.stringify({ type: 'skip_chat' }));
    }
    navigate('/match');
  };

  const handleSendFriendRequest = async () => {
    if (!partner?.id) return;
    try {
      await api.post('/friends/requests/', { target_user_id: partner.id });
      setFriendRequestSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-85px)] flex flex-col">
      {/* Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-inner">
            {partner.username?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <h2 className="font-bold text-white text-base">
              {partner.display_name || partner.username}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Connected in Chat</span>
            </div>
          </div>
        </div>

        {/* Common Interests Header Badges */}
        {commonInterests.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">You both like:</span>
            {commonInterests.map((interest, idx) => (
              <span key={idx} className="text-xs text-white font-medium bg-indigo-600/30 px-2 py-0.5 rounded-md">
                {interest}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {partner?.id && (
            <button
              onClick={handleSendFriendRequest}
              disabled={friendRequestSent}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                friendRequestSent
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              {friendRequestSent ? 'Sent' : 'Add Friend'}
            </button>
          )}
          <button
            onClick={handleSkipChat}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all flex items-center gap-1.5"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Next Match
          </button>
        </div>
      </div>

      {/* Messages Stream */}
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
                    msg.status === 'seen' ? (
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Check className="w-3 h-3 text-slate-500" />
                    )
                  )}
                </div>
              </div>
            );
          })
        )}

        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 italic font-medium pt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            {partner.username} is typing...
          </div>
        )}

        {chatEnded && (
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center text-violet-300 text-xs font-semibold">
            Chat session ended. Click Next Match to find a new stranger.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
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
    </div>
  );
};

export default ChatPage;
