import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, Sun, Moon, Bell, ChevronDown, User, Key, LogOut, Search, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getPhotoUrl } from '../../utils/photo';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

// Meta removed as per user request

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const showBackButton = location.pathname !== '/dashboard' && location.pathname !== '/';

  return (
    <header className="print:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5 bg-white/70 dark:bg-[#1e1b4b]/60 backdrop-blur-xl border-b border-white/20 dark:border-indigo-500/20 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-none">

      {/* Left: Hamburger + Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 bg-slate-100 dark:bg-slate-800 transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center mr-2 shadow-sm border border-slate-200 dark:border-slate-700"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{title}</h1>
          </div>
        </div>
      </div>

      {/* Right: Empty */}
      <div className="flex items-center gap-2 shrink-0">
      </div>
    </header>
  );
};
export default Header;
