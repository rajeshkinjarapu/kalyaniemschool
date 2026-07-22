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
    <header className="print:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-[length:200%_200%] animate-gradient-shift shadow-lg shadow-indigo-500/20">

      {/* Left: Hamburger + Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center mr-2 shadow-sm border border-white/20"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white leading-tight truncate drop-shadow-md">{title}</h1>
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
