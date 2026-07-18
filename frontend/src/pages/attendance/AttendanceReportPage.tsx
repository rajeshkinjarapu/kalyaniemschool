import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { FileDown, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const AttendanceReportPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const loadReport = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res: any = await api.get('/api/attendance/report', {
        params: { classId },
      });
      setReport(res.data || []);
    } catch (e) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [classId]);

  const handleExport = async () => {
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get(`/api/reports/attendance?classId=${classId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Attendance_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export attendance registry.', { id: importToast });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen animate-fade-in-up pb-10 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-6 md:p-8 rounded-none sm:rounded-3xl shadow-xl text-white transform transition-all sm:hover:scale-[1.01]">
        <div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Attendance Analytics</h3>
          <p className="text-indigo-100 mt-1 sm:mt-2 font-medium text-sm sm:text-lg opacity-90 leading-snug">View attendance rates and breakdown.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}-{c.section}
              </option>
            ))}
          </select>
          {classId && (
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
              <FileDown className="w-4.5 h-4.5" />
              <span>Export</span>
            </button>
          )}
          <Link to="/attendance" className="btn-primary text-sm">
            Mark Daily
          </Link>
        </div>
      </div>

      <div className="px-3 sm:px-0 space-y-6">
      {classId ? (
        loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-lg overflow-hidden shadow-2xl">
            <div className="overflow-x-auto w-full max-w-full block"><table className="w-full text-sm text-left">
              <thead className="bg-indigo-50/50 text-indigo-900 font-bold border-b border-indigo-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Total Days</th>
                  <th className="px-6 py-4">Present</th>
                  <th className="px-6 py-4">Absent</th>
                  <th className="px-6 py-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {report.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.studentName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.rollNo}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{item.totalDays}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">{item.present}</td>
                    <td className="px-6 py-4 text-red-500 font-bold">{item.absent}</td>
                    <td className="px-6 py-4 text-right font-black">
                      <span className={item.rate >= 75 ? 'text-green-600' : 'text-red-500'}>
                        {item.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {report.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No records configured for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
          </div>
        )
      ) : (
        <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-lg p-12 text-center text-indigo-400 shadow-2xl">
          <CalendarDays className="w-16 h-16 mx-auto text-indigo-300 mb-4 opacity-50" />
          <p className="font-bold text-lg text-indigo-900/60">Please select a class to view attendance analytics.</p>
        </div>
      )}
      </div>
    </div>
  );
};
export default AttendanceReportPage;
