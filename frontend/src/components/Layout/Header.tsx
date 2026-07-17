import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, Sun, Moon, Bell, ChevronDown, User, Key, LogOut, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const pageMeta: Record<string, { emoji: string; desc: string }> = {
  Dashboard:          { emoji: '🏠', desc: 'Overview & Analytics' },
  Students:           { emoji: '👨‍🎓', desc: 'Student Management' },
  Teachers:           { emoji: '👩‍🏫', desc: 'Teacher Management' },
  'Classes & Sections': { emoji: '🏫', desc: 'Class Management' },
  'Subjects & Curriculum': { emoji: '📚', desc: 'Curriculum Management' },
  'Attendance Marking': { emoji: '✅', desc: 'Track Daily Attendance' },
  'Examinations & Grades': { emoji: '📝', desc: 'Exams & Results' },
  'Class Timetables':  { emoji: '🗓️', desc: 'Schedule Management' },
  'Fee Management':   { emoji: '💳', desc: 'Finance & Payments' },
  'Notice Board':     { emoji: '📢', desc: 'Announcements' },
  'Real-time Messaging': { emoji: '💬', desc: 'Chat & Messages' },
  'Reports Generator': { emoji: '📊', desc: 'Analytics & Reports' },
  'School Settings':  { emoji: '⚙️', desc: 'Configuration' },
  'My Profile':       { emoji: '👤', desc: 'Profile & Security' },
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const meta = pageMeta[title] || { emoji: '📋', desc: 'School Management' };

  return (
    <header className="print:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">

      {/* Left: Hamburger + Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl leading-none shrink-0">{meta.emoji}</span>
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 leading-tight truncate">{title}</h1>
            <p className="text-[10px] font-semibold text-slate-400 leading-none hidden sm:block">{meta.desc}</p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-indigo-500/25">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight max-w-[100px] truncate">{user?.name}</p>
              <p className="text-[10px] font-semibold text-indigo-500 leading-none">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 animate-scale-in">
                {/* User Info */}
                <div className="px-3 py-2.5 mb-1 border-b border-slate-100">
                  <p className="text-sm font-black text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-150"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  My Profile
                </Link>
                <Link
                  to="/profile?tab=password"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-150"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  Change Password
                </Link>
                <div className="my-1.5 border-t border-slate-100" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150 text-left cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
