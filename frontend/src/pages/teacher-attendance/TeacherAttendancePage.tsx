import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronLeft, ChevronRight, User, Save, BarChart3, FileText, UserCheck,
} from 'lucide-react';

interface Teacher {
  id: string;
  employeeId: string;
  user: { id: string; name: string; email: string; photoUrl?: string };
}
interface AttRecord { id: string; teacherId: string; date: string; status: string; note?: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'];
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  PRESENT:  { bg: '#f0fdf4', text: '#16a34a', icon: CheckCircle2 },
  ABSENT:   { bg: '#fef2f2', text: '#dc2626', icon: XCircle      },
  LATE:     { bg: '#fffbeb', text: '#d97706', icon: Clock         },
  HALF_DAY: { bg: '#f0f9ff', text: '#0284c7', icon: CalendarCheck },
};

const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [myRecords, setMyRecords] = useState<AttRecord[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, halfDay: 0, total: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch teachers (Admin only)
  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers', { params: { limit: 200 } });
      setTeachers(res.data?.data || []);
    } catch {}
  };

  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Fetch attendance records for selected date (Admin) or month (Teacher)
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res: any = await api.get('/api/teacher-attendance', {
          params: { month: selectedMonth + 1, year: selectedYear }
        });
        setRecords(res.data?.data || []);

        // Build attendance map for the selected date
        const dateRecords = (res.data?.data || []).filter((r: AttRecord) =>
          new Date(r.date).toISOString().split('T')[0] === selectedDate
        );
        const map: Record<string, string> = {};
        const notes: Record<string, string> = {};
        dateRecords.forEach((r: AttRecord) => {
          map[r.teacherId] = r.status;
          notes[r.teacherId] = r.note || '';
        });
        setAttendanceMap(map);
        setNoteMap(notes);
      } else {
        const [attRes, leaveRes, gpRes]: any = await Promise.all([
          api.get('/api/teacher-attendance', { params: { month: selectedMonth + 1, year: selectedYear } }),
          api.get('/api/leave/my'),
          api.get('/api/gate-pass', { params: { limit: 100 } })
        ]);
        setMyRecords(attRes.data?.data || []);
        
        // Combine history
        const leaves = (leaveRes.data?.data || []).map((l: any) => ({ ...l, logType: l.type }));
        const passes = (gpRes.data?.data || []).map((gp: any) => ({ ...gp, logType: 'GATEPASS' }));
        const combined = [...leaves, ...passes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistoryLogs(combined);

        // Summary
        const arr = attRes.data?.data || [];
        const present = arr.filter((r: AttRecord) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absent = arr.filter((r: AttRecord) => r.status === 'ABSENT').length;
        const halfDay = arr.filter((r: AttRecord) => r.status === 'HALF_DAY').length;
        setSummary({ present, absent, halfDay, total: arr.length, rate: arr.length > 0 ? Math.round((present / arr.length) * 100) : 0 });
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAdmin) fetchTeachers();
  }, []);

  useEffect(() => { fetchRecords(); }, [selectedMonth, selectedYear, selectedDate, isAdmin]);

  const handleBulkSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const recs = teachers.map(t => ({
        teacherId: t.id,
        status: attendanceMap[t.id] || 'PRESENT',
        note: noteMap[t.id] || '',
      }));
      await api.post('/api/teacher-attendance/bulk-mark', { date: selectedDate, records: recs });
      setSuccessMsg('Attendance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save attendance');
    } finally { setSaving(false); }
  };

  // Build calendar for teacher view
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();

  const navigateMonth = (dir: number) => {
    const d = new Date(selectedYear, selectedMonth + dir, 1);
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen animate-fade-in-up pb-10 overflow-x-hidden">
      {/* Header */}
      <div className="relative overflow-hidden rounded-none sm:rounded-[2rem]" style={{
        background: 'linear-gradient(120deg, #0f172a 0%, #1e1b4b 50%, #7c3aed 100%)',
        boxShadow: '0 25px 50px -12px rgba(124,58,237,0.3)',
      }}>
        <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full opacity-30 animate-pulse"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
              <CalendarCheck className="w-7 h-7 text-violet-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isAdmin ? 'Staff Attendance' : 'My Attendance'}
              </h1>
              <p className="text-violet-200/80 text-sm font-medium mt-0.5">
                {isAdmin ? 'Mark and manage teacher attendance' : 'View your monthly attendance record'}
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition-all cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-black text-lg min-w-[140px] text-center">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <button onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition-all cursor-pointer"
              disabled={selectedMonth === today.getMonth() && selectedYear === today.getFullYear()}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN VIEW */}
      {isAdmin && (
        <div className="space-y-5 px-3 sm:px-0">
          {/* Date Selector */}
          <div className="flex items-center gap-4 bg-white rounded-[1.5rem] p-4 border border-slate-100"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <CalendarCheck className="w-5 h-5 text-violet-500" />
            <label className="text-sm font-bold text-slate-600">Mark attendance for date:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              max={today.toISOString().split('T')[0]}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer" />
            <button onClick={handleBulkSave} disabled={saving}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Teacher List */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div className="p-5 border-b border-slate-50">
              <h3 className="font-black text-slate-800">Teachers — {teachers.length} staff members</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {teachers.map(t => {
                const status = attendanceMap[t.id] || 'PRESENT';
                const sc = STATUS_COLORS[status];
                const StatusIcon = sc.icon;
                return (
                  <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                    {t.user.photoUrl ? (
                      <img src={t.user.photoUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-200" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                        {t.user.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{t.user.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{t.employeeId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s}
                          onClick={() => setAttendanceMap(m => ({ ...m, [t.id]: s }))}
                          className="px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border"
                          style={{
                            background: attendanceMap[t.id] === s || (!attendanceMap[t.id] && s === 'PRESENT')
                              ? STATUS_COLORS[s].bg : 'transparent',
                            color: attendanceMap[t.id] === s || (!attendanceMap[t.id] && s === 'PRESENT')
                              ? STATUS_COLORS[s].text : '#94a3b8',
                            borderColor: attendanceMap[t.id] === s || (!attendanceMap[t.id] && s === 'PRESENT')
                              ? STATUS_COLORS[s].text + '40' : '#e2e8f0',
                          }}>
                          {s === 'HALF_DAY' ? 'Half' : s === 'PRESENT' ? 'P' : s === 'ABSENT' ? 'A' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TEACHER VIEW — Calendar */}
      {isTeacher && (
        <div className="space-y-5 px-3 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: summary.present, color: '#22c55e', bg: '#f0fdf4' },
              { label: 'Absent', value: summary.absent, color: '#ef4444', bg: '#fef2f2' },
              { label: 'Half Day', value: summary.halfDay, color: '#0ea5e9', bg: '#f0f9ff' },
              { label: 'Attendance %', value: `${summary.rate}%`, color: '#8b5cf6', bg: '#faf5ff' },
            ].map((stat, i) => (
              <div key={i} className="rounded-[1.5rem] p-5 transition-all hover:-translate-y-1"
                style={{ background: stat.bg, border: `1px solid ${stat.color}20`, boxShadow: `0 4px 20px ${stat.color}10` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: stat.color }}>{stat.label}</p>
                <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Removed Calendar Section as requested */}

          {/* History Logs */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden mt-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800">My Requests History</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {historyLogs.map((log: any, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      log.logType === 'GATEPASS' ? 'bg-orange-500' : 
                      log.logType === 'LEAVE' ? 'bg-blue-500' : 'bg-teal-500'
                    }`}>
                      {log.logType === 'GATEPASS' ? <FileText className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {log.logType === 'GATEPASS' ? `Gatepass to ${log.destination}` : `${log.logType} Request`}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-md">
                        {log.reason}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                      log.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      log.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {log.status}
                    </span>
                    {log.logType !== 'GATEPASS' && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(log.startDate).toLocaleDateString()} {log.endDate && `- ${new Date(log.endDate).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {historyLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  No request history found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendancePage;
