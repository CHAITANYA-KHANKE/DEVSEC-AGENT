import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  LogOut,
  UserCheck,
  History,
  ChevronDown,
  User,
  PlusCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('user_email') || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync token and fetch current user profile if available
  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    setToken(currentToken);

    if (currentToken && !userEmail) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.email) {
            setUserEmail(data.email);
            localStorage.setItem('user_email', data.email);
          }
        })
        .catch(() => {});
    }
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setToken(null);
    setUserEmail('');
    setDropdownOpen(false);
    navigate('/');
  };

  // Generate 2 initials from email or fallback
  const getInitials = (email: string) => {
    if (!email) return 'FA';
    const namePart = email.split('@')[0];
    if (namePart.length >= 2) {
      return namePart.slice(0, 2).toUpperCase();
    }
    return namePart.toUpperCase();
  };

  const isDashboard = location.pathname === '/dashboard';
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#30363D]/60 bg-[#070A0E]/75 backdrop-blur-2xl transition-all duration-300">
      {/* Subtle top rainbow/emerald accent line */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#7EE787]/80 to-transparent opacity-70" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Classy Badge */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-[#7EE787]/40 group-hover:border-[#7EE787] transition-all duration-300 shadow-[0_0_16px_rgba(126,231,135,0.25)] group-hover:shadow-[0_0_24px_rgba(126,231,135,0.45)]">
            <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#7EE787] transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-xl bg-[#7EE787]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center">
            <span className="font-heading font-black tracking-wider text-sm sm:text-base text-[#F0F6FC] group-hover:text-[#7EE787] transition-colors whitespace-nowrap">
              DEVSEC <span className="text-[#7EE787]">AGENT</span>
            </span>
          </div>
        </Link>

        {/* Right Navigation & Profile Section */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!token ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#7EE787] to-[#3FB950] text-[#07110A] rounded-xl px-3 sm:px-4 py-2 font-heading text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_16px_rgba(126,231,135,0.3)] whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Classy Navigation Pills */}
              <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-[#161B22]/80 border border-[#30363D]/70 backdrop-blur-md shadow-inner">
                {/* Dashboard Link */}
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 sm:gap-2 font-mono text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isDashboard
                      ? 'bg-[#7EE787]/15 text-[#7EE787] border border-[#7EE787]/40 shadow-[0_0_12px_rgba(126,231,135,0.2)]'
                      : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/60'
                  }`}
                  title="Security Dashboard"
                >
                  <LayoutDashboard className={`w-3.5 h-3.5 ${isDashboard ? 'text-[#7EE787]' : 'text-[#8B949E]'}`} />
                  <span className="tracking-wide hidden xs:inline sm:inline">DASHBOARD</span>
                </Link>

                {/* New Scan Link */}
                <Link
                  to="/"
                  className={`inline-flex items-center gap-1 sm:gap-1.5 font-mono text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isHome
                      ? 'bg-[#7EE787]/15 text-[#7EE787] border border-[#7EE787]/40 shadow-[0_0_12px_rgba(126,231,135,0.2)]'
                      : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/60'
                  }`}
                  title="Launch New Scan"
                >
                  <PlusCircle className={`w-3.5 h-3.5 ${isHome ? 'text-[#7EE787]' : 'text-[#8B949E]'}`} />
                  <span className="tracking-wide hidden xs:inline sm:inline">NEW SCAN</span>
                </Link>
              </div>

              {/* User Profile Avatar Pill with Glowing Border */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 p-1 pr-1.5 sm:pr-2 rounded-xl border transition-all duration-200 cursor-pointer group shadow-md ${
                    dropdownOpen
                      ? 'border-[#7EE787] bg-[#161B22] shadow-[0_0_16px_rgba(126,231,135,0.25)]'
                      : 'border-[#30363D] bg-[#161B22]/90 hover:border-[#7EE787]/60 hover:bg-[#1C2128]'
                  }`}
                  title={userEmail || 'Account Profile'}
                >
                  {/* Initials Badge with Cyber Beacon Glow */}
                  <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#7EE787]/20 to-[#3FB950]/10 border border-[#7EE787]/50 text-[#7EE787] font-mono font-bold text-xs tracking-wider shadow-inner">
                    <span>{getInitials(userEmail)}</span>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7EE787] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#3FB950] border-2 border-[#0D1117]" />
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8B949E] transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180 text-[#7EE787]' : 'group-hover:text-[#F0F6FC]'
                    }`}
                  />
                </button>

                {/* Dropdown Menu Modal */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-[#30363D] bg-[#161B22]/95 backdrop-blur-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Header Info */}
                    <div className="px-4 py-3 border-b border-[#30363D]/70 bg-gradient-to-r from-[#1C2128] to-[#161B22]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#7EE787]" />
                        <span className="font-mono text-[10px] text-[#7EE787] uppercase font-bold tracking-wider">
                          Active Session
                        </span>
                      </div>
                      <p className="font-mono text-xs text-[#F0F6FC] font-semibold truncate">
                        {userEmail || 'developer@devsecagent.io'}
                      </p>
                    </div>

                    {/* Navigation Items */}
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-xs text-[#C9D1D9] hover:bg-[#21262D] hover:text-[#7EE787] transition group"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#7EE787] transition-transform group-hover:scale-110" />
                        <span>Security Dashboard</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-xs text-[#C9D1D9] hover:bg-[#21262D] hover:text-[#7EE787] transition group"
                      >
                        <History className="w-4 h-4 text-[#38BDF8] transition-transform group-hover:scale-110" />
                        <span>Scan History & Reports</span>
                      </Link>

                      <Link
                        to="/"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-xs text-[#C9D1D9] hover:bg-[#21262D] hover:text-[#7EE787] transition group"
                      >
                        <PlusCircle className="w-4 h-4 text-[#F2C94C] transition-transform group-hover:scale-110" />
                        <span>Launch New Scan</span>
                      </Link>
                    </div>

                    {/* Divider & Logout Action */}
                    <div className="border-t border-[#30363D]/70 mt-1 pt-1 p-1.5">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-xs text-[#FF6B6B] hover:bg-[#FF4D4D]/15 hover:text-[#FF8787] transition cursor-pointer text-left font-semibold"
                      >
                        <LogOut className="w-4 h-4 text-[#FF6B6B]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

