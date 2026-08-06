import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users, UserCheck, Search, Check, X, UserX, MessageSquare } from 'lucide-react';
import { Card, Avatar, Button, Badge } from '../components/ui';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFriends = async (query = '') => {
    try {
      const res = await api.get(`/friends/?search=${query}`);
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/friends/requests/');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchFriends(), fetchRequests()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    fetchFriends(q);
  };

  const handleAccept = async (reqId) => {
    try {
      await api.post(`/friends/requests/${reqId}/accept/`);
      fetchFriends(searchQuery);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (reqId) => {
    try {
      await api.post(`/friends/requests/${reqId}/reject/`);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChatWithFriend = async (friendId) => {
    try {
      const res = await api.post('/chat/friends/chat/', { friend_id: friendId });
      navigate(`/chat/${res.data.room_id}`, {
        state: {
          partner: res.data.partner,
          isFriendChat: true,
        },
      });
    } catch (err) {
      console.error('Failed to start chat session with friend:', err);
      alert('Could not start chat session with this friend.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Friends Network</h1>
          <p className="text-xs text-[#9EA4AF] mt-1">Manage accepted friends and pending invitations</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#9EA4AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search existing friends..."
            className="input pl-10 text-xs"
          />
        </div>
      </div>

      {/* Pending Requests Section */}
      {requests.length > 0 && (
        <Card className="p-6 bg-[#14181F] border-white/[0.05] space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-[#A66BFF]" />
            <span>Pending Friend Requests ({requests.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {requests.map((req) => {
              const name = req.sender.profile?.display_name || req.sender.username;
              return (
                <div
                  key={req.id}
                  className="bg-[#101319] p-4 rounded-xl border border-white/[0.05] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="md" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{name}</h3>
                      <span className="text-xs text-[#9EA4AF]">@{req.sender.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id)}
                      className="p-2 rounded-lg bg-[#7BAA82]/15 text-[#7BAA82] hover:bg-[#7BAA82]/25 transition-all cursor-pointer"
                      title="Accept"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="p-2 rounded-lg bg-[#D66B6B]/15 text-[#D66B6B] hover:bg-[#D66B6B]/25 transition-all cursor-pointer"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Friends List Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Users className="w-4 h-4 text-[#A66BFF]" />
          <span>My Friends ({friends.length})</span>
        </div>

        {friends.length === 0 ? (
          <Card className="p-12 text-center text-[#9EA4AF] space-y-3">
            <UserX className="w-8 h-8 mx-auto text-[#9EA4AF]/50" />
            <p className="text-xs">No friends added yet. Send friend requests during live chat matches!</p>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} size="md" online={isOnline} />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{name}</h3>
                          <span className="text-xs text-[#9EA4AF]">@{item.friend.username}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#9EA4AF]">
                      <span>{item.friend.profile?.country || 'Global'}</span>
                      <Badge tone="success">Friend</Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleChatWithFriend(item.friend.id)}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
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
