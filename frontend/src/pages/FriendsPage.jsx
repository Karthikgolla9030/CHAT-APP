import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserCheck, Search, Check, X, UserX, MessageSquare } from 'lucide-react';

const FriendsPage = () => {
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Friends Network</h1>
          <p className="text-slate-400 text-sm mt-1">Manage accepted friends and pending invitations</p>
        </div>

        {/* Search Bar - Note: Searching ONLY searches existing friends as requested */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search existing friends..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Pending Requests Section */}
      {requests.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
            <UserCheck className="w-4 h-4" />
            <span>Pending Friend Requests ({requests.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div key={req.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                    {req.sender.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{req.sender.profile?.display_name || req.sender.username}</h3>
                    <span className="text-xs text-slate-400">@{req.sender.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-base">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>My Friends ({friends.length})</span>
        </div>

        {friends.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3 text-slate-500">
            <UserX className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm">No friends added yet. Send friend requests during live chat matches!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {friends.map((item) => (
              <div key={item.id} className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white">
                    {item.friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{item.friend.profile?.display_name || item.friend.username}</h3>
                    <span className="text-xs text-indigo-400">@{item.friend.username}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{item.friend.profile?.country || 'Global'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                    Friend
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
