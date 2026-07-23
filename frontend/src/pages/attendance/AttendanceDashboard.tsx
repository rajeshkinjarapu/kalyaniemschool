import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Users, CheckCircle, XCircle, Percent, PlusCircle, Edit, Calendar, Download,
  Search, BookOpen, Clock, AlertTriangle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/attendance/dashboard-stats');
      setStats(res.data || res);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  // Extract day and max percentages for the bar chart
  const maxPercent = Math.max(...stats.weeklyTrend.map((w: any) => w.percentage), 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── TOP SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Present Today', value: stats.todayPresent, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Absent Today', value: stats.todayAbsent, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Attendance %', value: `${stats.attendancePercentage}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl ${c.bg}`}>
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">{c.label}</p>
              <p className="text-2xl font-black text-slate-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN (WIDER) ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/attendance/mark" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200">
                <CheckCircle className="w-4 h-4" /> Mark Attendance
              </Link>
              <button onClick={() => navigate('/attendance/mark')} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-2 transition-colors">
                <Edit className="w-4 h-4" /> Edit Attendance
              </button>
              <Link to="/attendance/report" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-2 transition-colors">
                <Calendar className="w-4 h-4" /> Monthly Report
              </Link>
              <Link to="/attendance/daily-report" className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Download PDF
              </Link>
            </div>
          </div>

          {/* Today's Attendance Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
              <p className="text-sm font-semibold text-slate-500 mb-1">Today's Date</p>
              <p className="text-xl font-black text-indigo-900 mb-1">
                {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm font-medium text-indigo-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">School Overview</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">LIVE</span>
              </div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Present</p>
                    <p className="text-2xl font-black text-emerald-600">{stats.todayPresent}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Absent</p>
                    <p className="text-2xl font-black text-rose-600">{stats.todayAbsent}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Leave</p>
                    <p className="text-2xl font-black text-amber-500">{stats.todayLeave}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-indigo-600">{stats.attendancePercentage}%</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.attendancePercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Class-wise Attendance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Class-wise Attendance
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 shadow-sm">
                  <tr>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Present</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Absent</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.classWise.length > 0 ? stats.classWise.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 font-bold text-slate-700">{c.className}</td>
                      <td className="py-3 px-6 font-semibold text-emerald-600 text-center">{c.present}</td>
                      <td className="py-3 px-6 font-semibold text-rose-500 text-center">{c.absent}</td>
                      <td className="py-3 px-6 font-black text-slate-800 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs ${c.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' : c.percentage >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {c.percentage}%
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">No attendance marked today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (NARROWER) ── */}
        <div className="space-y-6">
          
          {/* Quick Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              Quick Search
            </h3>
            <input
              type="text"
              placeholder="Student ID, Name, or Class..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Monthly Attendance Graph */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Weekly Trend
            </h3>
            <div className="space-y-4">
              {stats.weeklyTrend.map((day: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 text-xs font-bold text-slate-500">{day.day}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${day.percentage >= 90 ? 'bg-indigo-500' : day.percentage >= 75 ? 'bg-amber-400' : 'bg-rose-400'}`} 
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs font-black text-slate-700">{day.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Students on Leave */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              On Leave Today
            </h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {stats.studentsOnLeave.length > 0 ? stats.studentsOnLeave.map((s: any, i: number) => (
                <div key={i} className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.studentName}</p>
                    <p className="text-xs text-slate-500">{s.className}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded-md">{s.reason}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl">No students on leave today.</p>
              )}
            </div>
          </div>

          {/* Bottom Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/attendance/mark', label: 'Register', icon: Edit, color: 'text-blue-600' },
              { to: '/leave/request-log', label: 'Leaves', icon: FileText, color: 'text-emerald-600' },
              { to: '#', label: 'Holidays', icon: Calendar, color: 'text-amber-600' },
              { to: '#', label: 'Late Entry', icon: Clock, color: 'text-rose-600' }
            ].map((s, i) => (
              <Link key={i} to={s.to} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors shadow-sm">
                <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
                <span className="text-xs font-bold text-slate-600">{s.label}</span>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
