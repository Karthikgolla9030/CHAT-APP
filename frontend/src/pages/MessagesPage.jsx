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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {friends.map((item) => {
              const name = item.friend.profile?.display_name || item.friend.username;
              const isOnline = item.friend.profile?.online_status === 'online';

              return (
                <Card
                  key={item.id}
                  hover
                  className="p-5 bg-[#14181F] border-white/[0.05] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} size="md" online={isOnline} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Circle
                            className={`w-2 h-2 ${isOnline ? 'text-[#7BAA82] fill-[#7BAA82]' : 'text-[#9EA4AF]/40 fill-[#9EA4AF]/40'}`}
                          />
                          <span className="text-[11px] text-[#9EA4AF]">
                            {isOnline ? 'Available' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStartFriendChat(item.friend.id)}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#A66BFF]" />
                    <span>Open Messages</span>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
