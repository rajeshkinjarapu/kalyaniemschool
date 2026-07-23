import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Printer, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { toJpeg } from 'html-to-image';

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
    const toastId = toast.loading('Generating 9:16 Image...');
    try {
      // Temporarily remove transform to get full quality
      const originalWidth = reportElement.style.width; const originalHeight = reportElement.style.height; const originalPosition = reportElement.style.position; reportElement.style.width = '1080px'; reportElement.style.height = '1920px'; reportElement.style.position = 'absolute'; const imgData = await toJpeg(reportElement, { cacheBust: true, pixelRatio: 1.5, quality: 0.9, backgroundColor: '#ffffff' }); reportElement.style.width = originalWidth; reportElement.style.height = originalHeight; reportElement.style.position = originalPosition;
      
      const link = document.createElement('a');
      link.download = `Attendance_Report_${date}.png`;
      link.href = imgData;
      link.click();
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to download image', { id: toastId });
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

      {/* ── PRINTABLE AREA (Fixed 1080x1920 for 9:16) ── */}
      <div className="flex justify-center w-full overflow-hidden bg-slate-50 py-8 rounded-2xl print:bg-white print:py-0">
<div id="reportArea" className="bg-white border border-gray-150 shadow-2xl print:shadow-none print:border-none print:m-0 overflow-hidden relative flex flex-col w-full rounded-2xl">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 2px, transparent 2px)', backgroundSize: '32px 32px' }} />

            {/* Header Gradient */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-12 text-center relative overflow-hidden shrink-0 border-b-8 border-pink-500">
              <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500 rounded-full blur-[100px] opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-30"></div>
              
              <h1 className="text-5xl whitespace-nowrap font-black uppercase text-white tracking-widest drop-shadow-2xl relative z-10 mb-4">SRI VENKATESWARA JY SCHOOL</h1>
              <p className="text-2xl font-bold text-indigo-200 uppercase tracking-[0.3em] relative z-10 mb-8">Daily Attendance Report</p>
              
              <div className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-10 py-4 rounded-full font-black text-2xl text-white relative z-10 shadow-2xl">
                <Calendar className="w-8 h-8 text-pink-400" />
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className="p-12 flex-1 flex flex-col relative z-10">
              {loading ? (
                <LoadingSpinner size="lg" className="py-24 m-auto" />
              ) : (
            <>
              {(() => {
                const primaryClasses = data.filter(r => r.className.match(/(NUR|PP1|PP2|1st|2nd|3rd|4th|5th)/i));
                const secondaryClasses = data.filter(r => !r.className.match(/(NUR|PP1|PP2|1st|2nd|3rd|4th|5th)/i));
                
                return (
                  <>
              {/* Overall Summary Widgets */}
              <div className="grid grid-cols-4 gap-8 mb-12 shrink-0">
                {[
                  { label: 'Total Classes', val: totalClasses, c1: 'from-indigo-500 to-indigo-700', c2: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Total Strength', val: totalStudents, c1: 'from-blue-500 to-blue-700', c2: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Present', val: totalPresent, c1: 'from-emerald-500 to-emerald-700', c2: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Total Absent', val: totalAbsent, c1: 'from-rose-500 to-rose-700', c2: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden border border-white shadow-xl shadow-${s.c2.split('-')[1]}-900/5`}>
                    <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${s.c1}`} />
                    <p className={`text-lg font-black ${s.c2} uppercase tracking-widest mb-2 opacity-80`}>{s.label}</p>
                    <p className="text-6xl font-black text-slate-900 drop-shadow-sm">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Class-wise Tables */}
              <div className="flex-1 min-h-0 flex gap-4">
                {/* Primary Classes Table */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm">Class</th>
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm text-center">Total</th>
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm text-center text-emerald-400">Present</th>
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm text-center text-rose-400">Absent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {primaryClasses.map((row, index) => (
                        <tr key={row.classId} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-3 px-4 font-bold text-lg text-slate-800 border-r border-slate-100">{row.className}</td>
                          <td className="py-3 px-4 font-bold text-lg text-center text-slate-600 border-r border-slate-100">{row.total}</td>
                          <td className="py-3 px-4 font-black text-xl text-center text-emerald-600 bg-emerald-50/30 border-r border-slate-100">{row.present}</td>
                          <td className="py-3 px-4 font-black text-xl text-center text-rose-600 bg-rose-50/30">{row.absent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Secondary Classes Table */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm">Class</th>
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm text-center">Total</th>
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm text-center text-emerald-400">Present</th>
                        <th className="py-4 px-4 font-black uppercase tracking-widest text-sm text-center text-rose-400">Absent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {secondaryClasses.map((row, index) => (
                        <tr key={row.classId} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-3 px-4 font-bold text-lg text-slate-800 border-r border-slate-100">{row.className}</td>
                          <td className="py-3 px-4 font-bold text-lg text-center text-slate-600 border-r border-slate-100">{row.total}</td>
                          <td className="py-3 px-4 font-black text-xl text-center text-emerald-600 bg-emerald-50/30 border-r border-slate-100">{row.present}</td>
                          <td className="py-3 px-4 font-black text-xl text-center text-rose-600 bg-rose-50/30">{row.absent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Signature Area */}
              <div className="mt-12 pt-8 flex justify-between px-16 shrink-0 relative">
                <div className="absolute top-0 left-16 right-16 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                <div className="text-center">
                  <div className="w-64 border-b-2 border-slate-400 mb-4 border-dashed"></div>
                  <p className="text-lg font-black text-slate-500 uppercase tracking-[0.2em]">Class Teacher</p>
                </div>
                <div className="text-center">
                  <div className="w-64 border-b-2 border-slate-400 mb-4 border-dashed"></div>
                  <p className="text-lg font-black text-slate-500 uppercase tracking-[0.2em]">Principal Signature</p>
                </div>
              </div>
                  </>
                );
              })()}
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

