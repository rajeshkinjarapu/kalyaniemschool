import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Printer, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendanceDailyReportPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/api/attendance/daily-summary', { params: { date } });
      setData(res.data || res || []);
    } catch (e: any) {
      toast.error('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary();
  }, [date]);

  const handlePrint = () => {
    window.print();
  };

  const totalClasses = data.length;
  const totalStudents = data.reduce((acc, c) => acc + c.total, 0);
  const totalPresent = data.reduce((acc, c) => acc + c.present, 0);
  const totalAbsent = data.reduce((acc, c) => acc + c.absent, 0);
  const totalLate = data.reduce((acc, c) => acc + c.late, 0);
  const totalExcused = data.reduce((acc, c) => acc + c.excused, 0);

  return (
    <div className="space-y-6">
      {/* ── PRINT CONTROLS (Hidden on Print) ── */}
      <div className="print:hidden flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Daily Attendance Report</h3>
            <p className="text-xs text-gray-500">Select a date to view the school-wide summary</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer className="w-4.5 h-4.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* ── PRINTABLE AREA ── */}
      <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* School Header (Styled for Professional A4 Print) */}
        <div className="text-center pb-6 border-b-2 border-gray-200 mb-6">
          <h1 className="text-3xl font-black uppercase text-gray-900 tracking-wider">JY School ERP</h1>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">Daily Attendance Summary</p>
          <div className="mt-4 inline-block bg-gray-50 border border-gray-200 px-6 py-2 rounded-full font-bold text-gray-700">
            Date: {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <>
            {/* Overall Summary Widgets */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Classes</p>
                <p className="text-2xl font-black text-gray-900">{totalClasses}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Strength</p>
                <p className="text-2xl font-black text-blue-600">{totalStudents}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Present</p>
                <p className="text-2xl font-black text-emerald-600">{totalPresent}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Absent</p>
                <p className="text-2xl font-black text-red-600">{totalAbsent}</p>
              </div>
            </div>

            {/* Class-wise Table */}
            <table className="w-full text-sm text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border border-gray-200 font-bold text-gray-700 uppercase">Class</th>
                  <th className="p-3 border border-gray-200 font-bold text-gray-700 uppercase text-center">Total Strength</th>
                  <th className="p-3 border border-gray-200 font-bold text-gray-700 uppercase text-center">Present</th>
                  <th className="p-3 border border-gray-200 font-bold text-gray-700 uppercase text-center">Absent</th>
                  <th className="p-3 border border-gray-200 font-bold text-gray-700 uppercase text-center">Late</th>
                  <th className="p-3 border border-gray-200 font-bold text-gray-700 uppercase text-center">Excused</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.classId} className="hover:bg-gray-50">
                    <td className="p-3 border border-gray-200 font-bold text-gray-900">{row.className}</td>
                    <td className="p-3 border border-gray-200 text-center font-semibold text-gray-700">{row.total}</td>
                    <td className="p-3 border border-gray-200 text-center font-semibold text-emerald-600">{row.present}</td>
                    <td className="p-3 border border-gray-200 text-center font-semibold text-red-600">{row.absent}</td>
                    <td className="p-3 border border-gray-200 text-center font-semibold text-amber-600">{row.late}</td>
                    <td className="p-3 border border-gray-200 text-center font-semibold text-indigo-600">{row.excused}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Signature Area */}
            <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between px-10">
              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold text-gray-500 uppercase">Class Teacher / Checker</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold text-gray-500 uppercase">Principal Signature</p>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
