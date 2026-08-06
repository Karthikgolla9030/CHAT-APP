import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useActiveChat } from '../../context/ActiveChatContext';
import {
  Sparkles,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { Logo } from '../ui';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { handleLogoutClear, randomRoomId, friendRoomId } = useActiveChat();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    handleLogoutClear();
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const activeRoomId = randomRoomId || friendRoomId;

  const navItems = [
    { label: 'Find Match', path: '/match', icon: Sparkles },
    { label: 'Friends', path: '/friends', icon: Users },
    {
      label: 'Messages',
      path: '/messages',
      icon: MessageSquare,
      badge: activeRoomId ? '1' : null,
    },
    {
      label: 'Settings',
      path: user?.is_guest ? '/claim-account' : '/profile',
      icon: Settings,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#101319] text-[#F4F5F7] border-r border-white/[0.05]">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.05]">
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen?.(false)}>
          <Logo showSubtitle />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen?.(!mobileOpen)}
          className="lg:hidden text-[#9EA4AF] hover:text-white p-1 rounded-lg hover:bg-[#1A1F28]"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileOpen?.(false)}
              className={`group flex items-center justify-between h-10 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#1A1F28] text-white shadow-sm font-semibold'
                  : 'text-[#9EA4AF] hover:text-white hover:bg-[#1A1F28]/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    active ? 'text-[#A66BFF]' : 'text-[#9EA4AF] group-hover:text-white'
                  }`}
                  strokeWidth={2}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    active
                      ? 'bg-[#D97FA6] text-white'
                      : 'bg-[#D97FA6]/20 text-[#D97FA6]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout Guest Action */}
      <div className="p-3 border-t border-white/[0.05]">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-[#D66B6B] hover:bg-[#D66B6B]/10 transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-[#D66B6B]" strokeWidth={2} />
            <span>{user.is_guest ? 'Logout Guest' : 'Sign out'}</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center h-10 px-3 rounded-xl text-sm font-medium btn-primary"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-[240px] flex-shrink-0 h-screen sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile drawer backdrop & drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-full h-full z-10 animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
