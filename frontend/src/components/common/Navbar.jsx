import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useActiveChat } from '../../context/ActiveChatContext';
import {
  User,
  LogOut,
  KeyRound,
  ChevronDown,
  Menu,
  Sun,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '../ui';

export const Navbar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { handleLogoutClear } = useActiveChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    handleLogoutClear();
    logout();
    navigate('/');
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const displayName = user?.profile?.display_name || user?.username || 'Guest';

  return (
    <header className="h-15 sticky top-0 z-20 bg-[#101319] border-b border-white/[0.05] flex items-center px-4 sm:px-6 justify-between">
      {/* Left section: mobile hamburger trigger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen?.(!mobileOpen)}
          className="lg:hidden p-2 rounded-xl text-[#9EA4AF] hover:text-white hover:bg-[#1A1F28] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small breadcrumb or view context indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#9EA4AF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7BAA82]" />
          <span>ConnectSphere Network</span>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        {/* Subtle Theme / Utility Toggle Icon */}
        <button
          type="button"
          className="p-2 rounded-xl text-[#9EA4AF] hover:text-white hover:bg-[#1A1F28] transition-colors"
          aria-label="Theme options"
          title="Light/Dark toggle"
        >
          <Sun className="w-4 h-4" />
        </button>

        {user ? (
          <>
            {user.is_guest && (
              <Link
                to="/claim-account"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[#D9A441]/40 bg-[#D9A441]/10 text-xs font-medium text-[#D9A441] hover:bg-[#D9A441]/20 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Claim Account</span>
              </Link>
            )}

            {/* Account User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 h-9 pl-1 pr-2.5 rounded-full bg-[#14181F] border border-white/[0.08] hover:border-white/15 text-xs text-[#F4F5F7] transition-all duration-200 cursor-pointer"
              >
                <Avatar name={displayName} size="sm" />
                <span className="max-w-[8rem] truncate font-medium">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9EA4AF]" />
              </button>

              {menuOpen && (
                <div role="menu" className="menu absolute right-0 top-11 w-56">
                  <div className="px-3 py-2 mb-1 border-b border-white/[0.06]">
                    <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-[#9EA4AF] mt-0.5">
                      {user.is_guest ? 'Guest Session' : `@${user.username}`}
                    </p>
                  </div>

                  {!user.is_guest && (
                    <Link to="/profile" role="menuitem" className="menu-item">
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                  )}
                  {user.is_guest && (
                    <Link to="/claim-account" role="menuitem" className="menu-item">
                      <KeyRound className="w-4 h-4 text-[#D9A441]" />
                      <span>Claim Account</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="menu-item text-[#D66B6B] hover:text-[#D66B6B] hover:bg-[#D66B6B]/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
