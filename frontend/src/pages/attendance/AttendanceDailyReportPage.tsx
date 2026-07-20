import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Printer, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

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

  const handleDownloadImage = async () => {
    const reportElement = document.getElementById('reportArea');
    if (!reportElement) return;
    try {
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Attendance_Report_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── PRINT CONTROLS (Hidden on Print) ── */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Daily Attendance Report</h3>
            <p className="text-xs text-gray-500">Select a date to view the school-wide summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input min-w-[140px]"
          />
          <button onClick={handleDownloadImage} className="btn-secondary flex items-center gap-1.5 md:gap-2 whitespace-nowrap bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
            <Download className="w-4 h-4 md:w-4.5 md:h-4.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
            <Printer className="w-4 h-4 md:w-4.5 md:h-4.5" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* ── PRINTABLE AREA ── */}
      <div className="flex justify-center w-full">
        <div id="reportArea" className="bg-white rounded-2xl border border-gray-150 shadow-sm print:shadow-none print:border-none print:m-0 w-full max-w-4xl mx-auto overflow-hidden
          sm:aspect-auto aspect-[9/16] relative flex flex-col">
          
          {/* Header Gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 text-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase text-white tracking-wider drop-shadow-md relative z-10">SRI VENKATESWARA JY SCHOOL</h1>
            <p className="text-sm md:text-base font-semibold text-indigo-100 uppercase tracking-widest mt-2 relative z-10">Daily Attendance Summary</p>
            <div className="mt-4 inline-block bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full font-bold text-white relative z-10 shadow-lg">
              Date: {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="p-4 md:p-8 flex-1 flex flex-col">
            {loading ? (
              <LoadingSpinner size="lg" className="py-12 m-auto" />
            ) : (
          <>
            {/* Overall Summary Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 shrink-0">
              <div className="p-3 md:p-4 rounded-xl border-l-4 border-l-indigo-500 bg-indigo-50/50 text-center shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Classes</p>
                <p className="text-xl md:text-2xl font-black text-indigo-900">{totalClasses}</p>
              </div>
              <div className="p-3 md:p-4 rounded-xl border-l-4 border-l-blue-500 bg-blue-50/50 text-center shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Total Strength</p>
                <p className="text-xl md:text-2xl font-black text-blue-900">{totalStudents}</p>
              </div>
              <div className="p-3 md:p-4 rounded-xl border-l-4 border-l-emerald-500 bg-emerald-50/50 text-center shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Present</p>
                <p className="text-xl md:text-2xl font-black text-emerald-900">{totalPresent}</p>
              </div>
              <div className="p-3 md:p-4 rounded-xl border-l-4 border-l-red-500 bg-red-50/50 text-center shadow-sm">
                <p className="text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Total Absent</p>
                <p className="text-xl md:text-2xl font-black text-red-900">{totalAbsent}</p>
              </div>
            </div>

            {/* Class-wise Table */}
            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-xs md:text-sm text-left border-collapse rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                    <th className="p-2 md:p-3 font-black text-gray-800 uppercase tracking-wider">Class</th>
                    <th className="p-2 md:p-3 font-black text-gray-800 uppercase tracking-wider text-center">Total</th>
                    <th className="p-2 md:p-3 font-black text-emerald-700 uppercase tracking-wider text-center bg-emerald-50/50">Present</th>
                    <th className="p-2 md:p-3 font-black text-red-700 uppercase tracking-wider text-center bg-red-50/50">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {data.map((row) => (
                    <tr key={row.classId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-2 md:p-3 font-bold text-gray-900 border-l-[3px] border-l-transparent hover:border-l-indigo-500">{row.className}</td>
                      <td className="p-2 md:p-3 text-center font-semibold text-gray-700">{row.total}</td>
                      <td className="p-2 md:p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">{row.present}</td>
                      <td className="p-2 md:p-3 text-center font-bold text-red-600 bg-red-50/30">{row.absent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Signature Area */}
            <div className="mt-8 md:mt-12 pt-6 border-t border-gray-200 flex justify-between px-4 md:px-10 shrink-0">
              <div className="text-center">
                <div className="w-24 md:w-40 border-b-2 border-gray-400 mb-2"></div>
                <p className="text-[9px] md:text-xs font-black text-gray-500 uppercase tracking-widest">Teacher</p>
              </div>
              <div className="text-center">
                <div className="w-24 md:w-40 border-b-2 border-gray-400 mb-2"></div>
                <p className="text-[9px] md:text-xs font-black text-gray-500 uppercase tracking-widest">Principal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
