import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveChat } from '../context/ActiveChatContext';
import api from '../services/api';
import { MessageSquare, Users, Sparkles, ArrowRight, UserX, Circle } from 'lucide-react';
import { Card, Avatar, Button, Badge } from '../components/ui';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { randomRoomId, friendRoomId, randomPartner, friendPartner, randomInterests, randomChatEnded, hasActiveRedisSession, validateActiveSessionWithRedis } = useActiveChat();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const isRandomActive = Boolean(hasActiveRedisSession && randomRoomId && !randomChatEnded);
  const activeRoomId = isRandomActive ? randomRoomId : friendRoomId;
  const activePartner = isRandomActive ? randomPartner : friendPartner;

  useEffect(() => {
    validateActiveSessionWithRedis();
    const fetchFriendsForMessages = async () => {
      try {
        setLoading(true);
        const res = await api.get('/friends/');
        setFriends(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriendsForMessages();

    // Listen to global notifications for realtime new_message updates while on this page
    let ws = null;
    const token = localStorage.getItem('access_token');
    if (token) {
      // WS_BASE_URL logic
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_API_BASE_URL 
        ? import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
        : window.location.host;
      const WS_BASE = `${protocol}//${host}`;
      
      ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'notification' && data.data?.type === 'new_message') {
          const senderId = data.data.sender_id;
          const content = data.data.content;
          
          setFriends(prev => prev.map(f => {
            if (f.friend.id === senderId) {
              return {
                ...f,
                unread_count: (f.unread_count || 0) + 1,
                last_message: {
                  content: content,
                  created_at: data.data.created_at,
                  sender_id: senderId
                }
              };
            }
            return f;
          }));
        }
      };
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleStartFriendChat = async (friendId) => {
    try {
      const res = await api.post('/chat/friends/chat/', { friend_id: friendId });
      navigate(`/chat/${res.data.room_id}`, {
        state: {
          partner: res.data.partner,
          isFriendChat: true,
        },
      });
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('Could not open chat with this friend.');
    }
  };

  const handleResumeActiveChat = () => {
    if (!activeRoomId) return;
    const isRandom = activeRoomId === randomRoomId;
    navigate(`/chat/${activeRoomId}`, {
      state: {
        partner: activePartner,
        common_interests: isRandom ? randomInterests : [],
        isRandomChat: isRandom,
        isFriendChat: !isRandom,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Messages Hub</h1>
          <p className="text-xs text-[#9EA4AF] mt-1">Direct conversations &amp; active live chat sessions</p>
        </div>

        {isRandomActive && (
          <Button
            onClick={handleResumeActiveChat}
            variant="primary"
            size="md"
            className="gap-2 font-semibold"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Return to Active Chat</span>
          </Button>
        )}
      </div>

      {/* Active Live Chat Banner if in progress */}
      {isRandomActive && (
        <Card className="p-6 bg-[#14181F] border-white/[0.08] shadow-menu">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={activePartner?.display_name || activePartner?.username || 'P'} size="lg" online />
              <div>
                <Badge tone="rose">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97FA6] dot-live" />
                  <span>ACTIVE CHAT SESSION</span>
                </Badge>
                <h3 className="text-base font-semibold text-white mt-1">
                  Chatting with {activePartner?.display_name || activePartner?.username}
                </h3>
                <p className="text-xs text-[#9EA4AF] mt-0.5">Session connected in real time</p>
              </div>
            </div>

            <Button
              onClick={handleResumeActiveChat}
              variant="primary"
              size="md"
              className="gap-2 w-full sm:w-auto"
            >
              <span>Resume Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Conversations / Direct Friends Messages List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Users className="w-4 h-4 text-[#A66BFF]" />
            <span>Direct Conversations ({friends.length})</span>
          </div>
          <span className="text-xs text-[#9EA4AF]">Click any friend to message</span>
        </div>

        {friends.length === 0 ? (
          <Card className="p-12 text-center text-[#9EA4AF] space-y-3">
            <UserX className="w-8 h-8 mx-auto text-[#9EA4AF]/40" />
            <p className="text-xs">No direct messaging history yet. Match with people or add friends to start chatting!</p>
            <div className="pt-2">
              <Button
                onClick={() => navigate('/match')}
                variant="primary"
                size="md"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Find a Match</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {friends.map((item) => {
              const name = item.friend.profile?.display_name || item.friend.username;
              const isOnline = item.friend.profile?.online_status === 'online';
              
              const formatTime = (isoString) => {
                if (!isoString) return '';
                const date = new Date(isoString);
                const now = new Date();
                const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                if (date.toDateString() === now.toDateString()) {
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
                  return 'Yesterday';
                } else if (diffDays < 7) {
                  return date.toLocaleDateString([], { weekday: 'short' });
                } else {
                  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
              };

              return (
                <Card
                  key={item.id}
                  hover
                  onClick={() => handleStartFriendChat(item.friend.id)}
                  className="p-4 bg-[#14181F] border-white/[0.05] cursor-pointer w-full transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4 w-full">
                    {/* Only pass online prop if they are explicitly 'online' */}
                    <Avatar name={name} size="lg" online={isOnline ? true : undefined} />
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-white text-base truncate">{name}</h3>
                          {/* Removed the '🟢 Online / ⚪ Offline' text as requested */}
                        </div>
                        {item.last_message && (
                          <span className="text-xs text-[#9EA4AF] flex-shrink-0 ml-3">
                            {formatTime(item.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center gap-4">
                        <p className="text-sm text-[#9EA4AF] truncate">
                          {item.last_message ? (
                            <>{item.last_message.sender_id === user?.id ? 'You: ' : ''}{item.last_message.content}</>
                          ) : (
                            <span className="italic opacity-50">No messages yet</span>
                          )}
                        </p>
                        
                        {item.unread_count > 0 && (
                          <div className="bg-[#D97FA6] text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
                            {item.unread_count > 99 ? '99+' : item.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
