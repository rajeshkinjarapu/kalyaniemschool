import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/UI/Avatar';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { AccountantDashboard } from './AccountantDashboard';
import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, School, Wallet, CalendarDays,
  FileText, Award, ArrowUpRight, Clock, Activity,
  PieChart as PieChartIcon, TrendingUp, BarChart3,
  BookOpen, CheckCircle2, XCircle, Megaphone, Star,
  ChevronRight, Zap, Target, BookMarked, UserCheck, PenTool, CreditCard,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { getPhotoUrl } from '../../utils/photo';

/* ─────────────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleMap: Record<string, string> = {
    super_admin: 'admin',
    admin: 'admin',
    teacher: 'teacher',
    student: 'student',
    parent: 'parent',
    accountant: 'accountant',
  };

  const endpoint = roleMap[user?.role?.toLowerCase() || ''] || 'admin';

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard', endpoint],
    queryFn: async () => {
      const res = await api.get(`/api/dashboard/${endpoint}`);
      return res.data || res;
    },
    enabled: !!user && user.role !== 'ACCOUNTANT',
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  if (user?.role === 'ACCOUNTANT') return <AccountantDashboard />;

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;
  if (!data)
    return <p className="text-center py-12 text-gray-400">Failed to load. Please refresh.</p>;


  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen animate-fade-in-up pb-10">
      <WelcomeBanner name={user?.name || ''} role={user?.role || ''} photoUrl={data?.teacherProfile?.photoUrl || data?.studentProfile?.photoUrl || user?.photoUrl} />
      <div className="px-3 sm:px-0">
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && <AdminView data={data} />}
        {user?.role === 'TEACHER' && <TeacherView data={data} />}
        {user?.role === 'STUDENT' && <StudentView data={data} />}
      </div>
    </div>
  );
};

/* ── Welcome Banner ─────────────────────────────────────── */
const WelcomeBanner: React.FC<{ name: string; role: string; photoUrl?: string }> = ({ name, role, photoUrl }) => {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  const emoji = h < 12 ? '🌅' : h < 17 ? '☀️' : '🌙';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const roleLabel: Record<string, string> = {
    TEACHER: 'Teacher', STUDENT: 'Student', ACCOUNTANT: 'Accountant',
  };
  return (
    <div className="relative overflow-hidden rounded-none sm:rounded-[2rem]" style={{
      background: 'linear-gradient(120deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      boxShadow: '0 25px 50px -12px rgba(49, 46, 129, 0.4)',
    }}>
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-10 w-72 h-72 rounded-full opacity-40 mix-blend-screen animate-pulse"
        style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', animationDuration: '4s' }} />
      <div className="absolute -bottom-24 -left-10 w-80 h-80 rounded-full opacity-30 mix-blend-screen animate-pulse"
        style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)', animationDuration: '6s' }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Glass Panel Content */}
      <div className="relative z-10 p-4 sm:p-5 md:p-6 flex items-center justify-between gap-3 md:gap-6 h-full">
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="text-indigo-300/80 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-400 animate-ping absolute" />
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-400 relative" />
            {greeting}
          </p>
          <h1 className="text-[20px] sm:text-3xl md:text-5xl font-black text-white mb-1.5 md:mb-2 tracking-tight whitespace-nowrap truncate max-w-full">
            {(() => {
              if (!name) return '';
              if (name.length <= 15) return name;
              const parts = name.split(' ').filter(Boolean);
              if (parts.length >= 3) {
                const initials = parts.slice(0, -1).map(p => p.replace(/[^A-Za-z]/g, '')[0] || '').join('').toUpperCase();
                return `${initials} ${parts[parts.length - 1]}`;
              }
              return name;
            })()}
          </h1>
          <p className="text-indigo-100/90 text-[10px] sm:text-sm md:text-base font-semibold mb-3 md:mb-4 truncate">{roleLabel[role] || role} <span className="mx-1.5 md:mx-2 opacity-50">•</span> JY School</p>
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2.5 rounded-[0.8rem] md:rounded-[1rem] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors shadow-inner">
              <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-300" />
              <span className="text-[10px] md:text-xs font-bold text-white tracking-wide">{today}</span>
            </div>
          </div>
        </div>
        
        {/* Photo Box on Right Side */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="w-[80px] h-[90px] sm:w-[110px] sm:h-[120px] md:w-[140px] md:h-[150px] rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center text-3xl md:text-5xl shadow-2xl relative overflow-hidden border-2 md:border-[3px] border-indigo-400/40"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            {getPhotoUrl(photoUrl) ? (
              <img 
                src={getPhotoUrl(photoUrl)} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-4xl shadow-sm ${getPhotoUrl(photoUrl) ? 'hidden' : ''}`}>
              {name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : emoji}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Shared helpers ─────────────────────────────────────── */
interface StatCardProps {
  label: string; value: string | number; icon: React.ElementType;
  gradient: string; glow: string; link?: string; sub?: string;
  badge?: string; badgeColor?: string; onClick?: () => void;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, gradient, glow, link, sub, badge, badgeColor, onClick }) => {
  const iconColor = gradient.includes('#6366f1') ? '#6366f1'
    : gradient.includes('#10b981') ? '#10b981'
    : gradient.includes('#f59e0b') ? '#d97706'
    : gradient.includes('#f43f5e') ? '#e11d48'
    : gradient.includes('#06b6d4') ? '#0891b2' : '#8b5cf6';
    
  const inner = (
    <div className="group relative overflow-hidden rounded-[1.5rem] p-4 transition-all duration-500 hover:-translate-y-1 cursor-pointer shadow-lg border border-white/20"
      style={{ background: gradient, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' }}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-bl-full"
        style={{ backgroundImage: `linear-gradient(to bottom left, ${iconColor}, transparent)` }} />
        
      {/* Top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity bg-white/30" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2 md:mb-5">
          <div className="p-2 md:p-3 rounded-xl md:rounded-[1rem] bg-white/20 shadow-inner backdrop-blur-md border border-white/30"
            style={{ boxShadow: `0 8px 16px ${glow}` }}>
            <Icon className="w-4 h-4 md:w-6 md:h-6 text-white drop-shadow-md" />
          </div>
          {badge && (
            <span className="text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full border shadow-sm"
              style={{ background: badgeColor ? badgeColor + '15' : '#ecfdf5', color: badgeColor || '#065f46', borderColor: badgeColor ? badgeColor + '30' : '#a7f3d0' }}>
              {badge}
            </span>
          )}
          {link && !badge && (
            <div className="p-1.5 md:p-2 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors border border-white/20">
              <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </div>
          )}
        </div>
        <p className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-wider mb-0.5 md:mb-1 truncate">{label}</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-none drop-shadow-md">{value}</p>
        {sub && <p className="text-[8px] sm:text-[10px] md:text-[11px] text-white/90 mt-1 md:mt-2 font-bold flex items-center gap-1 sm:gap-1.5 opacity-90 truncate"><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/80 shrink-0"/>{sub}</p>}
      </div>
    </div>
  );
  if (onClick) {
    return <div onClick={onClick}>{inner}</div>;
  }
  return link ? <Link to={link}>{inner}</Link> : inner;
};

const SectionHeader: React.FC<{
  title: string; subtitle?: string; icon: React.ElementType;
  iconColor?: string; action?: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, iconColor = '#6366f1', action }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: iconColor + '18' }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const ChartCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-[2rem] p-6 relative overflow-hidden bg-white/70 backdrop-blur-xl border-[3px] border-indigo-200/50 ring-4 ring-white/60 transition-all duration-300 hover:shadow-2xl hover:bg-white/90 group ${className}`}
    style={{ 
      boxShadow: '0 20px 40px -5px rgba(99, 102, 241, 0.15)',
    }}>
    {/* Decorative colorful ambient glow */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-400/20 to-rose-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const TT = { borderRadius: '14px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 600 };
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];

/* ── Admin View ─────────────────────────────────────────── */
const AdminView: React.FC<{ data: any }> = ({ data }) => {
  const totalPresent = data.attendanceTrend?.reduce((s: number, d: any) => s + d.present, 0) || 0;
  const totalAbsent  = data.attendanceTrend?.reduce((s: number, d: any) => s + d.absent, 0) || 0;
  const attendancePct = totalPresent + totalAbsent > 0
    ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : data.attendanceToday || 0;

  const stats: StatCardProps[] = [
    { label: 'Total Students', value: data.totalStudents, icon: Users, gradient: 'linear-gradient(90deg,#6366f1,#818cf8)', glow: 'rgba(99,102,241,0.08)', link: '/students', sub: 'Enrolled this year' },
    { label: 'Total Teachers', value: data.totalTeachers, icon: GraduationCap, gradient: 'linear-gradient(90deg,#10b981,#34d399)', glow: 'rgba(16,185,129,0.08)', link: '/teachers', sub: 'On staff' },
    { label: 'Total Classes', value: data.totalClasses, icon: School, gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,0.08)', link: '/classes', sub: 'Active sections' },
    { label: 'Total Revenue', value: `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`, icon: Wallet, gradient: 'linear-gradient(90deg,#f43f5e,#fb7185)', glow: 'rgba(244,63,94,0.08)', link: '/finance?tab=transaction', sub: 'Fees collected' },
    { label: 'Collect Payment', value: 'Fees', icon: CreditCard, gradient: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', glow: 'rgba(139,92,246,0.08)', link: '/fee-payment?action=collect', sub: 'Process new fees' },
    { label: 'Results', value: 'Exams', icon: FileText, gradient: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', glow: 'rgba(14,165,233,0.08)', link: '/exams?tab=results', sub: 'View exam scores' },
  ];

  const pieData = [
    { name: 'Male',   value: data.genderDistribution?.male   || 0 },
    { name: 'Female', value: data.genderDistribution?.female || 0 },
    { name: 'Other',  value: data.genderDistribution?.other  || 0 },
  ].filter(d => d.value > 0);

  const enrollmentData = (data.enrollmentByClass || []).slice(0, 8);

  return (
    <div className="space-y-7">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Attendance Ribbon */}
      <div className="relative overflow-hidden rounded-2xl p-5" style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#1e293b 100%)',
        boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
      }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle,#818cf8,transparent)' }} />
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Today's Attendance", value: `${data.attendanceToday || 0}%`, icon: CheckCircle2, color: '#10b981' },
            { label: '7-Day Avg', value: `${attendancePct}%`, icon: Activity, color: '#818cf8' },
            { label: 'Present (7d)', value: totalPresent, icon: UserCheck, color: '#34d399' },
            { label: 'Absent (7d)', value: totalAbsent, icon: XCircle, color: '#f87171' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 md:gap-3">
                <div className="p-2 md:p-2.5 rounded-[0.6rem] md:rounded-xl shrink-0" style={{ background: item.color + '22' }}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">{item.label}</p>
                  <p className="text-white text-base sm:text-lg md:text-xl font-black mt-0.5">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard className="hidden md:block lg:col-span-3">
          <SectionHeader title="Revenue Trend" subtitle="Monthly fee collection (last 12 months)" icon={TrendingUp} iconColor="#6366f1"
            action={<Link to="/finance" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">View Finance <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyFeeCollection} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <RechartsTooltip contentStyle={TT} formatter={(v: any) => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard className="hidden md:block lg:col-span-2">
          <SectionHeader title="Demographics" subtitle="Student gender distribution" icon={PieChartIcon} iconColor="#8b5cf6" />
          <div className="h-[200px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="48%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={TT} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data yet.</div>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: COLORS[i] + '18', color: COLORS[i] }}>
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />{d.name}: {d.value}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard className="hidden md:block lg:col-span-3">
          <SectionHeader title="Attendance Overview" subtitle="Present vs absent — last 7 days" icon={Activity} iconColor="#10b981" />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                <RechartsTooltip contentStyle={TT} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 8 }} />
                <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Class Enrollment" subtitle="Students per class" icon={BarChart3} iconColor="#f59e0b"
            action={<Link to="/classes" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700">All Classes <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="h-[220px]">
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} width={52} />
                  <RechartsTooltip contentStyle={TT} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">No enrollment data.</div>}
          </div>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard>
          <SectionHeader title="Recent Payments" subtitle="Latest fee transactions" icon={Wallet} iconColor="#6366f1"
            action={<Link to="/fee-payment" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="space-y-3">
            {data.recentPayments?.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No recent payments.</p>}
            {data.recentPayments?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                    {p.student.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{p.student.user.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{p.feeStructure.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">₹{p.amountPaid.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard>
          <SectionHeader title="Notice Board" subtitle="Latest school announcements" icon={Megaphone} iconColor="#8b5cf6"
            action={<Link to="/announcements" className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="space-y-3">
            {data.recentAnnouncements?.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No announcements.</p>}
            {data.recentAnnouncements?.map((a: any, i: number) => {
              const c = COLORS[i % COLORS.length];
              return (
                <div key={a.id} className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 group cursor-pointer transition-colors">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: c + '18' }}>
                    <span className="text-[9px] font-black uppercase" style={{ color: c }}>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-sm font-black" style={{ color: c }}>{new Date(a.createdAt).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{a.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 font-medium">{a.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

/* ── Teacher View ───────────────────────────────────────── */
const TeacherView: React.FC<{ data: any }> = ({ data }) => {
  const navigate = useNavigate();
  const [showMarksModal, setShowMarksModal] = React.useState(false);
  const [exams, setExams] = React.useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = React.useState('');
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [loadingExams, setLoadingExams] = React.useState(false);

  const handleOpenMarksModal = async () => {
    setShowMarksModal(true);
    setLoadingExams(true);
    try {
      const res = await api.get('/api/exams');
      setExams(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleGoToMarks = () => {
    if (selectedExamId && selectedClassId) {
      navigate(`/exams/${selectedExamId}/entry?classId=${selectedClassId}`);
    }
  };

  const { rate = 0, present = 0, absent = 0, total = 0 } = data.todayAttendanceSummary || {};
  const { teacherProfile, myAttendance, pendingSalary, recentHomework } = data;
  const classBarData = (data.assignedClasses || []).map((c: any) => ({ name: c.className, students: c.studentCount }));

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-7">
      {/* Teacher Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {[
          { label: 'Daily Attendance', value: 'Mark', icon: UserCheck, gradient: 'linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Students Attendance', link: '/attendance' },
          { label: 'Total Students', value: data.totalStudents || 0, icon: Users, gradient: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Across all classes', link: '/teachers/students' },
          { label: "Today's Att.", value: `${rate}%`, icon: Clock, gradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', glow: 'rgba(255,255,255,0.2)', sub: `${present}P · ${absent}A`, link: '/teacher-attendance' },
          { label: 'My Timetable', value: 'View', icon: School, gradient: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Weekly Schedule', link: '/timetable' },
          { label: 'Marks Entry', value: 'Enter', icon: PenTool, gradient: 'linear-gradient(135deg,#ec4899 0%,#e11d48 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Update grades', link: '/exams' },
          { label: 'Results', value: 'View', icon: Award, gradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'View all results', link: '/exams' },
          { label: 'Result Cards', value: 'View', icon: FileText, gradient: 'linear-gradient(135deg,#14b8a6 0%,#0f766e 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Progress Cards', link: '/exams?tab=jee-progress-card' },
          { label: 'Admit Cards', value: 'View', icon: BookMarked, gradient: 'linear-gradient(135deg,#8b5cf6 0%,#3b82f6 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Students Admit Cards', link: '/teacher/admit-cards' },
          { label: 'Leave Apply', value: 'Apply', icon: FileText, gradient: 'linear-gradient(135deg,#06b6d4 0%,#2563eb 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Request leave', link: '/leave' },
          { label: 'Salary Status', value: pendingSalary ? `₹${pendingSalary.netSalary}` : 'All Paid', icon: Wallet, gradient: 'linear-gradient(135deg,#f43f5e 0%,#e11d48 100%)', glow: 'rgba(255,255,255,0.2)', sub: pendingSalary ? 'Pending' : 'No dues' },
        ].map((stat, i) => <StatCard key={i} {...(stat as StatCardProps)} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timetable */}
        <ChartCard className="border border-slate-100">
          <SectionHeader title="Today's Schedule" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long' })} icon={CalendarDays} iconColor="#06b6d4" />
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
            {data.timetableToday?.length > 0 ? data.timetableToday.map((slot: any, idx: number) => (
              <div key={idx} className="relative flex gap-3">
                {idx < data.timetableToday.length - 1 && <div className="absolute left-[18px] top-10 bottom-[-12px] w-px bg-slate-100" />}
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center z-10" style={{ background: 'rgba(6,182,212,0.12)' }}>
                  <Clock className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="pb-3 pt-1 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{slot.subject.name}</p>
                    <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{slot.startTime}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{slot.class.name}-{slot.class.section} · ends {slot.endTime}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-8">No classes scheduled today.</p>}
          </div>
        </ChartCard>

        {/* Recent Homework */}
        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Recent Homework" subtitle="Latest assignments given" icon={BookOpen} iconColor="#8b5cf6"
            action={<Link to="/homework" className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentHomework?.length > 0 ? recentHomework.slice(0, 4).map((hw: any) => (
              <div key={hw.id} className="p-4 rounded-[1.2rem] border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors hover:shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{hw.class.name}-{hw.class.section}</span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${hw.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{hw.status}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{hw.title}</h4>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-semibold text-slate-500">{hw.subject.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3"/> Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </span>
                </div>
              </div>
            )) : <div className="col-span-2 text-center py-10 text-slate-400 text-sm">No homework assigned recently.</div>}
          </div>
        </ChartCard>
      </div>

      {data.announcements?.length > 0 && (
        <ChartCard>
          <SectionHeader title="Announcements" subtitle="For teachers" icon={Megaphone} iconColor="#f59e0b"
            action={<Link to="/announcements" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.announcements.slice(0, 3).map((a: any, i: number) => {
              const c = COLORS[i % COLORS.length];
              return (
                <div key={a.id} className="p-4 rounded-xl" style={{ background: c + '08', border: `1px solid ${c}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-3.5 h-3.5" style={{ color: c }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c }}>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{a.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{a.content}</p>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}
    </div>
  );
};


/* ── Student View ───────────────────────────────────────── */
const StudentView: React.FC<{ data: any }> = ({ data }) => {
  const navigate = useNavigate();
  const attPct = data.attendancePercentage || 0;
  const feeStatus = data.feeStatus?.status || 'NO_FEES';
  const attColor = attPct >= 80 ? '#10b981' : attPct >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Attendance Rate', value: `${attPct}%`, icon: CalendarDays, gradient: `linear-gradient(90deg,${attColor},${attColor}99)`, glow: attColor + '15', sub: 'Last 30 days', badge: attPct >= 80 ? '✓ Good' : 'At Risk', badgeColor: attPct >= 80 ? '#10b981' : '#f59e0b' },
          { label: 'Latest Score', value: data.recentMarks?.length > 0 ? `${data.recentMarks[0].marksObtained}/${data.recentMarks[0].maxMarks}` : 'N/A', icon: Award, gradient: 'linear-gradient(90deg,#6366f1,#818cf8)', glow: 'rgba(99,102,241,0.08)', sub: data.recentMarks?.[0]?.examName || 'No results yet', badge: data.recentMarks?.[0]?.grade, badgeColor: '#6366f1' },
          { label: 'Fee Status', value: feeStatus === 'PAID' ? 'Paid ✓' : feeStatus === 'PARTIAL' ? 'Partial' : 'Pending', icon: FileText, gradient: feeStatus === 'PAID' ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)', glow: feeStatus === 'PAID' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', sub: feeStatus === 'PAID' ? 'All dues cleared' : 'Payment pending', link: '/finance' },
          { label: 'Admit Cards', value: 'View', icon: BookMarked, gradient: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', glow: 'rgba(139,92,246,0.08)', sub: 'Download admit cards', link: '/student/admit-cards' },
        ].map((s, i) => <StatCard key={i} {...(s as StatCardProps)} />)}
      </div>

      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${attColor}15,${attColor}05)`, border: `1px solid ${attColor}25` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black text-slate-700">Attendance Progress (Last 30 Days)</span>
          <span className="text-lg font-black" style={{ color: attColor }}>{attPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${attPct}%`, background: `linear-gradient(90deg,${attColor},${attColor}bb)` }} />
        </div>
        <p className="text-xs font-semibold mt-2" style={{ color: attColor }}>
          {attPct >= 80 ? '✓ Good standing' : attPct >= 60 ? '⚠ Attendance at risk' : '✗ Low attendance — action needed'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard className="lg:col-span-3">
          <SectionHeader title="Academic Performance" subtitle="Recent examination results" icon={Award} iconColor="#6366f1"
            action={<Link to="/exams" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">Full Report <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  <th className="text-left py-2 px-2">Subject</th>
                  <th className="text-left py-2 px-2">Exam</th>
                  <th className="text-left py-2 px-2">Score</th>
                  <th className="text-right py-2 px-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMarks?.map((m: any, i: number) => {
                  const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                  const gc = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
                  return (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-800">{m.subjectName}</td>
                      <td className="py-3 px-2 text-slate-500 font-medium text-xs">{m.examName}</td>
                      <td className="py-3 px-2">
                        <span className="font-black" style={{ color: '#6366f1' }}>{m.marksObtained}/{m.maxMarks}</span>
                        <span className="text-[10px] text-slate-400 font-medium ml-1">({pct}%)</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ background: gc + '18', color: gc }}>{m.grade}</span>
                      </td>
                    </tr>
                  );
                })}
                {(!data.recentMarks || data.recentMarks.length === 0) && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No grades recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Today's Classes" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long' })} icon={CalendarDays} iconColor="#06b6d4" />
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {data.timetableToday?.length > 0 ? data.timetableToday.map((slot: any, idx: number) => (
              <div key={idx} className="relative flex gap-3">
                {idx < data.timetableToday.length - 1 && <div className="absolute left-[18px] top-10 bottom-[-12px] w-px bg-slate-100" />}
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center z-10" style={{ background: 'rgba(6,182,212,0.12)' }}>
                  <BookOpen className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="pb-3 pt-1 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{slot.subject.name}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{slot.startTime}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{slot.teacher?.user?.name || 'N/A'}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-8">No classes today.</p>}
          </div>
        </ChartCard>
      </div>

      {data.admitCards?.length > 0 && (
        <ChartCard>
          <SectionHeader title="My Admit Cards" subtitle="Available to download" icon={BookMarked} iconColor="#ec4899" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.admitCards.map((exam: any) => (
              <div key={exam.id} className="p-4 rounded-xl border border-pink-100 bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer group" onClick={() => navigate(`/admit-card-view/${exam.id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-600">Admit Card</span>
                  <BookMarked className="w-4 h-4 text-pink-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-pink-700 transition-colors">{exam.name}</h4>
                <p className="text-xs font-semibold text-slate-500 mt-1">Tap to View & Download</p>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {data.upcomingExams?.length > 0 && (
        <ChartCard>
          <SectionHeader title="Upcoming Exams" subtitle="Scheduled examinations" icon={BookMarked} iconColor="#f43f5e" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.upcomingExams.slice(0, 6).map((ex: any) => {
              const daysLeft = Math.ceil((new Date(ex.examDate).getTime() - Date.now()) / 86400000);
              const urgency = daysLeft <= 3 ? '#f43f5e' : daysLeft <= 7 ? '#f59e0b' : '#6366f1';
              return (
                <div key={ex.id} className="p-4 rounded-xl" style={{ background: urgency + '08', border: `1px solid ${urgency}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: urgency }}>
                      {daysLeft <= 0 ? 'Today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                    </span>
                    <Target className="w-3.5 h-3.5" style={{ color: urgency }} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{ex.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {new Date(ex.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}
    </div>
  );
};

export default DashboardPage;

