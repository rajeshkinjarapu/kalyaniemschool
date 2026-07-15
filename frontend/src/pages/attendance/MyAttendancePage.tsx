import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { CalendarCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const MyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        let studentId = '';
        if (user?.role === 'STUDENT') {
          // fetch student profile to get studentId
          const res = await api.get('/api/auth/me');
          studentId = res.data?.student?.id;
        }

        if (!studentId) {
          setLoading(false);
          return;
        }

        const res: any = await api.get('/api/attendance/student', {
          params: { studentId }
        });
        setAttendance(res.data || []);
      } catch (error) {
        toast.error('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user]);

  if (loading) return <div className="p-6"><LoadingSpinner /></div>;

  const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
  const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
  const lateDays = attendance.filter(a => a.status === 'LATE').length;
  const totalDays = attendance.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <CalendarCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
          <p className="text-gray-500 text-sm">View your attendance history and statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-white dark:bg-gray-800 border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500 font-medium">Total Days</p>
          <p className="text-2xl font-bold mt-1">{totalDays}</p>
        </div>
        <div className="card p-5 bg-white dark:bg-gray-800 border-l-4 border-emerald-500">
          <p className="text-sm text-gray-500 font-medium">Present</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{presentDays}</p>
        </div>
        <div className="card p-5 bg-white dark:bg-gray-800 border-l-4 border-rose-500">
          <p className="text-sm text-gray-500 font-medium">Absent</p>
          <p className="text-2xl font-bold mt-1 text-rose-600">{absentDays}</p>
        </div>
        <div className="card p-5 bg-white dark:bg-gray-800 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500 font-medium">Attendance %</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{attendancePercentage}%</p>
        </div>
      </div>

      <div className="card bg-white dark:bg-gray-800 p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Recent Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4">{format(new Date(record.date), 'dd MMM yyyy, EEEE')}</td>
                  <td className="px-6 py-4">
                    {record.status === 'PRESENT' && <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle2 size={14} /> Present</span>}
                    {record.status === 'ABSENT' && <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold"><XCircle size={14} /> Absent</span>}
                    {record.status === 'LATE' && <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-bold"><Clock size={14} /> Late</span>}
                    {record.status === 'HALF_DAY' && <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-bold"><Clock size={14} /> Half Day</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{record.note || '-'}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
