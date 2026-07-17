import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen,
  CalendarCheck, ClipboardList, PenTool, Calendar, CreditCard,
  Megaphone, MessageSquare, BarChart3, Settings, LogOut,
<<<<<<< HEAD
  Shield, FileText, UserCheck, X, ChevronDown, Smartphone,
=======
  Shield, FileText, UserCheck, X, ChevronDown, MapPin,
>>>>>>> 3e5ae40 (Add colorful Gate Pass dashboard and route)
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface SidebarProps { isOpen: boolean; setIsOpen: (v: boolean) => void; }

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', TEACHER: 'Teacher',
  STUDENT: 'Student', ACCOUNTANT: 'Accountant',
};

// Each nav item gets a specific vivid color
const NAV_COLORS: Record<string, { text: string; bg: string; glow: string }> = {
  Dashboard:     { text: '#a5b4fc', bg: 'rgba(99,102,241,0.18)',  glow: '0 0 12px rgba(99,102,241,.5)'  },
  Forms:         { text: '#93c5fd', bg: 'rgba(59,130,246,0.18)',  glow: '0 0 12px rgba(59,130,246,.5)'  },
  Students:      { text: '#67e8f9', bg: 'rgba(6,182,212,0.18)',   glow: '0 0 12px rgba(6,182,212,.5)'   },
  Teachers:      { text: '#6ee7b7', bg: 'rgba(16,185,129,0.18)',  glow: '0 0 12px rgba(16,185,129,.5)'  },
  Classes:       { text: '#86efac', bg: 'rgba(34,197,94,0.18)',   glow: '0 0 12px rgba(34,197,94,.5)'   },
  Subjects:      { text: '#d9f99d', bg: 'rgba(132,204,22,0.18)',  glow: '0 0 12px rgba(132,204,22,.5)'  },
  Attendance:    { text: '#fde68a', bg: 'rgba(245,158,11,0.18)',  glow: '0 0 12px rgba(245,158,11,.5)'  },
  'Daily Report':{ text: '#fde68a', bg: 'rgba(245,158,11,0.18)',  glow: '0 0 12px rgba(245,158,11,.5)'  },
  Exams:         { text: '#fca5a5', bg: 'rgba(239,68,68,0.18)',   glow: '0 0 12px rgba(239,68,68,.5)'   },
  'Examination': { text: '#fca5a5', bg: 'rgba(239,68,68,0.18)',   glow: '0 0 12px rgba(239,68,68,.5)'   },
  'My Grades':   { text: '#fca5a5', bg: 'rgba(239,68,68,0.18)',   glow: '0 0 12px rgba(239,68,68,.5)'   },
  Timetable:     { text: '#67e8f9', bg: 'rgba(6,182,212,0.18)',   glow: '0 0 12px rgba(6,182,212,.5)'   },
  Leave:         { text: '#fdba74', bg: 'rgba(249,115,22,0.18)',  glow: '0 0 12px rgba(249,115,22,.5)'  },
  'Gate Pass':   { text: '#f9a8d4', bg: 'rgba(236,72,153,0.16)', glow: '0 0 12px rgba(236,72,153,.45)' },
  Finance:       { text: '#c4b5fd', bg: 'rgba(139,92,246,0.18)', glow: '0 0 12px rgba(139,92,246,.5)'  },
  'Fee Payment': { text: '#a78bfa', bg: 'rgba(139,92,246,0.18)', glow: '0 0 12px rgba(139,92,246,.5)'  },
  'My Fees':     { text: '#c4b5fd', bg: 'rgba(139,92,246,0.18)', glow: '0 0 12px rgba(139,92,246,.5)'  },
  Announcements: { text: '#e9d5ff', bg: 'rgba(168,85,247,0.18)', glow: '0 0 12px rgba(168,85,247,.5)'  },
  Messages:      { text: '#f0abfc', bg: 'rgba(217,70,239,0.18)', glow: '0 0 12px rgba(217,70,239,.5)'  },
  Reports:       { text: '#fda4af', bg: 'rgba(244,63,94,0.18)',  glow: '0 0 12px rgba(244,63,94,.5)'   },
  Settings:      { text: '#94a3b8', bg: 'rgba(100,116,139,0.18)',glow: '0 0 12px rgba(100,116,139,.5)' },
  Roles:         { text: '#a5b4fc', bg: 'rgba(99,102,241,0.15)', glow: '0 0 12px rgba(99,102,241,.4)'  },
  'My Students': { text: '#67e8f9', bg: 'rgba(6,182,212,0.18)',   glow: '0 0 12px rgba(6,182,212,.5)'   },
  'My Attendance':{ text: '#fde68a', bg: 'rgba(245,158,11,0.18)', glow: '0 0 12px rgba(245,158,11,.5)'  },
  'My Salary':   { text: '#c4b5fd', bg: 'rgba(139,92,246,0.18)', glow: '0 0 12px rgba(139,92,246,.5)'  },
  Homework:      { text: '#86efac', bg: 'rgba(34,197,94,0.18)',   glow: '0 0 12px rgba(34,197,94,.5)'   },
  'HR Salary':   { text: '#c4b5fd', bg: 'rgba(139,92,246,0.18)', glow: '0 0 12px rgba(139,92,246,.5)'  },
  'Staff Attendance': { text: '#fde68a', bg: 'rgba(245,158,11,0.18)', glow: '0 0 12px rgba(245,158,11,.5)' },
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  const { isInstallable, installApp } = usePWA();

  useEffect(() => {
    api.get('/api/settings').then((r: any) => {
      if (r.data?.schoolName) setSchoolName(r.data.schoolName);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const role = user.role;

  const getLinks = () => {
    const base = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') return [...base,
      { to: '/students',      label: 'Students',      icon: Users         },
      { to: '/teachers',      label: 'Teachers',      icon: GraduationCap },
      { to: '/classes',       label: 'Classes',       icon: School        },
      { to: '/subjects',      label: 'Subjects',      icon: BookOpen      },
      { to: '/attendance',    label: 'Attendance',    icon: CalendarCheck },
      { to: '/attendance/daily-report', label: 'Daily Report', icon: FileText },
      { to: '/gate-pass',     label: 'Gate Pass',     icon: FileText },
      { to: '/exams',         label: 'Exams',         icon: ClipboardList },
      { to: '/timetable',     label: 'Timetable',     icon: Calendar      },
      { to: '/leave/gate-pass', label: 'Gate Pass',    icon: MapPin       },
      { to: '/leave/type',    label: 'Leave',         icon: UserCheck     },
      { to: '/finance',       label: 'Finance',       icon: CreditCard    },
      { to: '/fee-payment',   label: 'Fee Payment',   icon: CreditCard    },
      { to: '/announcements', label: 'Announcements', icon: Megaphone     },
      { to: '/messages',      label: 'Messages',      icon: MessageSquare },
      { to: '/reports',       label: 'Reports',       icon: BarChart3     },
      // HR Section
      { to: '/hr/salary',        label: 'HR Salary',         icon: Shield    },
      { to: '/teacher-attendance', label: 'Staff Attendance', icon: UserCheck },
      { to: '/homework',         label: 'Homework',          icon: BookOpen  },
      { to: '/settings',      label: 'Settings',      icon: Settings      },
    ];
    if (role === 'TEACHER') return [...base,
      { to: '/teachers/students', label: 'My Students',    icon: Users         },
      { to: '/attendance',        label: 'Attendance',     icon: CalendarCheck },
      { to: '/teacher-attendance',label: 'My Attendance',  icon: UserCheck     },
      { to: '/homework',          label: 'Homework',       icon: BookOpen      },
      { to: '/exams',             label: 'Examination',    icon: PenTool       },
      { to: '/timetable',         label: 'Timetable',      icon: Calendar      },
      { to: '/gate-pass',         label: 'Gate Pass',      icon: FileText      },
      { to: '/leave/request-log', label: 'Leave',          icon: UserCheck     },
      { to: '/salary',            label: 'My Salary',      icon: CreditCard    },
      { to: '/fee-payment',       label: 'Fee Payment',    icon: CreditCard    },
      { to: '/announcements',     label: 'Announcements',  icon: Megaphone     },
      { to: '/messages',          label: 'Messages',       icon: MessageSquare },
    ];
    if (role === 'STUDENT') return [...base,
      { to: '/exams',     label: 'My Grades',     icon: ClipboardList },
      { to: '/attendance',label: 'Attendance',    icon: CalendarCheck },
      { to: '/timetable', label: 'Timetable',     icon: Calendar      },
      { to: '/homework',  label: 'Homework',      icon: BookOpen      },
      { to: '/finance',   label: 'My Fees',       icon: CreditCard    },
      { to: '/gate-pass', label: 'Gate Pass', icon: FileText },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/messages',  label: 'Messages',      icon: MessageSquare },
    ];
    if (role === 'ACCOUNTANT') return [...base,
      { to: '/finance',   label: 'Finance',       icon: CreditCard    },
      { to: '/fee-payment',   label: 'Fee Payment',   icon: CreditCard    },
      { to: '/gate-pass', label: 'Gate Pass', icon: FileText },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/messages',  label: 'Messages',      icon: MessageSquare },
    ];
    return base;
  };

  const links = getLinks();

  const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => {
    const isActive = to === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
      : location.pathname.startsWith(to);
    const c = NAV_COLORS[label] || NAV_COLORS['Settings'];

    return (
      <NavLink
        to={to}
        onClick={() => setIsOpen(false)}
        style={isActive ? { background: c.bg, boxShadow: c.glow } : {}}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none group
          ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/6'}`}
      >
        <span
          style={isActive ? { color: c.text } : {}}
          className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all
            ${isActive ? '' : 'group-hover:opacity-100 opacity-60'}`}
        >
          <Icon className="w-[17px] h-[17px]" strokeWidth={isActive ? 2.5 : 2} />
        </span>
        <span className="flex-1 truncate">{label}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text }} />
        )}
      </NavLink>
    );
  };

  const Content = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-white overflow-hidden shadow-sm"
            style={{ boxShadow: '0 4px 16px rgba(99,102,241,.5)' }}>
            <img src="/logo.png?v=1" alt="School Logo" className="w-full h-full object-contain p-0.5" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-indigo-600 font-bold text-xs">JY</span>'; }} />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-[15px] font-extrabold text-white leading-tight break-words">{schoolName}</h1>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {links.map(l => <NavItem key={l.to} {...l} />)}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3 border-t border-white/8">
        {/* PWA Install */}
        {isInstallable && (
          <div className="px-4 mb-4">
            <button
              onClick={installApp}
              className="w-full flex items-center gap-2 justify-center py-2 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg shadow-md transition-all font-bold text-sm cursor-pointer shadow-indigo-500/20"
            >
              <Smartphone className="w-4 h-4" /> Install App
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {user.photoUrl ? (
            <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden border border-white/20">
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,.4)' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{user.name}</p>
            <p className="text-[10px] font-semibold" style={{ color: '#818cf8' }}>{roleLabels[user.role]}</p>
          </div>
          <button onClick={logout} title="Logout"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const sidebarStyle = {
    background: 'linear-gradient(180deg, #0f1729 0%, #111827 60%, #0d1117 100%)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)} />
      )}
      {/* Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={sidebarStyle}>
        <button onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        <Content />
      </aside>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0" style={sidebarStyle}>
        <Content />
      </aside>
    </>
  );
};
export default Sidebar;
