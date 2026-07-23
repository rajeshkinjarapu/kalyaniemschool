import React from 'react';
import { Award, User, MapPin } from 'lucide-react';

interface ProgressCardTemplateProps {
  data: any;
  exam: any;
  settings?: any;
}

export const ProgressCardTemplate: React.FC<ProgressCardTemplateProps> = ({ data, exam, settings = {} }) => {
  const totalMaxMarks = data.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
  const totalObtained = data.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
  const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : "0.0";
  const percentNumber = Number(percentage);
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const logoUrl = resolveUrl(settings?.logoUrl) || '/logo.png'; 
  const principalSignatureUrl = resolveUrl(settings?.signatureUrl || '');
  const teacherSignatureUrl = resolveUrl(settings?.teacherSignatureUrl || '');

  // Determine Overall Performance
  let performanceRating = "Needs Improvement";
  let performanceColor = "text-rose-600 border-rose-300 bg-rose-50";
  let progressColor = "from-rose-400 to-rose-600";
  
  if (percentNumber >= 90) { 
    performanceRating = "Outstanding"; 
    performanceColor = "text-emerald-700 border-emerald-300 bg-emerald-50"; 
    progressColor = "from-emerald-400 to-emerald-600";
  } else if (percentNumber >= 75) { 
    performanceRating = "Excellent"; 
    performanceColor = "text-blue-700 border-blue-300 bg-blue-50"; 
    progressColor = "from-blue-400 to-blue-600";
  } else if (percentNumber >= 60) { 
    performanceRating = "Very Good"; 
    performanceColor = "text-indigo-700 border-indigo-300 bg-indigo-50"; 
    progressColor = "from-indigo-400 to-indigo-600";
  } else if (percentNumber >= 40) { 
    performanceRating = "Good"; 
    performanceColor = "text-amber-700 border-amber-300 bg-amber-50"; 
    progressColor = "from-amber-400 to-amber-600";
  }

  return (
    <div className="progress-card-wrapper w-full max-w-[210mm] print:w-[210mm] print:h-[297mm] mx-auto bg-white relative box-border flex flex-col overflow-hidden shadow-2xl" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always', fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif' }}>
      
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="w-full h-full relative flex flex-col bg-transparent z-10 border-[8px] border-indigo-50/50">
        
        {/* Beautiful Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-violet-800 to-indigo-900 text-white p-6 sm:p-8 flex items-center justify-between shadow-md">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-black/20 rounded-full blur-2xl translate-y-1/2" />
          
          <div className="flex w-full items-center gap-6 relative z-10">
            {/* Logo in a crisp circle */}
            <div className="w-24 h-24 shrink-0 bg-white p-2 rounded-2xl shadow-lg border-2 border-white/20 flex items-center justify-center transform -rotate-2">
              {logoUrl ? (
                <img src={logoUrl} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-indigo-900 font-black text-xl">LOGO</div>
              )}
            </div>
            
            {/* School Info */}
            <div className="flex-1 text-center pr-10">
              <h1 className="text-[24px] sm:text-[28px] font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-100 drop-shadow-sm uppercase mb-1">
                SRI VENKATESWARA JY SCHOOL
              </h1>
              <p className="text-[12px] sm:text-[14px] font-bold tracking-[0.15em] text-amber-300 mb-2 uppercase drop-shadow-sm">
                (IIT-JEE / NEET Foundation • Olympiads)
              </p>
              <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-black/20 px-4 py-1.5 rounded-full text-indigo-100 backdrop-blur-sm border border-white/10 mb-3">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
              </div>
            </div>
          </div>
        </div>

        {/* Exam Ribbon */}
        <div className="bg-amber-400 text-indigo-900 font-black text-center py-2 text-sm tracking-[0.2em] uppercase shadow-sm">
          {exam?.name || 'EXAMINATION RESULT CARD'}
        </div>

        {/* Main Content Area */}
        <div className="flex-grow p-8 sm:p-10 flex flex-col gap-8 bg-white/80 backdrop-blur-sm">
          
          {/* Student Profile Card */}
          <div className="flex flex-col sm:flex-row gap-8 items-stretch">
            
            {/* Photo Box */}
            <div className="w-[120px] shrink-0 flex flex-col justify-start pt-2">
              <div className="w-full aspect-[3/4] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-4 border-white overflow-hidden flex items-center justify-center relative">
                {data.photo ? (
                  <img src={resolveUrl(data.photo)} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Details Table */}
            <div className="flex-grow bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <table className="w-full text-sm text-left h-full">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="bg-slate-50/50 font-bold py-3 px-5 w-1/3 text-slate-500 uppercase tracking-wider text-xs">Student Name</td>
                    <td className="font-black py-3 px-5 text-indigo-950 text-base">{data.studentName}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50/50 font-bold py-3 px-5 uppercase tracking-wider text-xs text-slate-500">Student ID</td>
                    <td className="font-bold py-3 px-5 text-slate-700">{data.rollNo}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50/50 font-bold py-3 px-5 uppercase tracking-wider text-xs text-slate-500">Class & Section</td>
                    <td className="font-bold py-3 px-5 text-slate-700">{data.className} {data.section && `- ${data.section}`}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50/50 font-bold py-3 px-5 uppercase tracking-wider text-xs text-slate-500">WhatsApp</td>
                    <td className="font-bold py-3 px-5 text-slate-700">{data.mobile || '-'}</td>
                  </tr>
                  <tr>
                    <td className="bg-indigo-50/50 font-bold py-3 px-5 uppercase tracking-wider text-xs text-indigo-600">Class Rank</td>
                    <td className="font-black py-3 px-5 text-amber-600 bg-amber-50/30 text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" /> #{data.rank || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Performance Table */}
          <div className="mt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
              <h3 className="font-black text-indigo-950 text-lg uppercase tracking-wider">Academic Performance</h3>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-100">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center w-12 text-indigo-200">#</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-left">Subject</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center">Max Marks</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center">Obtained</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center">Grade %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.marks.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-black text-slate-700">{m.subject}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-500">{m.maxMarks || 100}</td>
                      <td className="py-3 px-4 text-center font-black text-indigo-600 text-base">{m.obtained}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-700 font-bold text-xs">
                          {((m.obtained / (m.maxMarks || 100)) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Grand Total Row */}
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-200">
                    <td colSpan={2} className="py-4 px-4 text-left font-black uppercase text-amber-900 tracking-widest text-sm">Grand Total</td>
                    <td className="py-4 px-4 text-center font-black text-amber-900 text-sm">{totalMaxMarks}</td>
                    <td className="py-4 px-4 text-center font-black text-indigo-700 text-xl">{totalObtained}</td>
                    <td className="py-4 px-4 text-center font-black text-emerald-600 text-lg">{percentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
            
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-center items-center text-center">
               <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Overall Grade</span>
               <div className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-sm border-2 shadow-sm ${performanceColor}`}>
                 {performanceRating}
               </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score Graph</span>
                <span className="text-sm font-black text-indigo-900">{totalObtained} / {totalMaxMarks}</span>
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} flex items-center justify-end px-2 shadow-sm`}
                  style={{ width: `${Math.max(15, percentNumber)}%` }}
                >
                  <span className="text-[10px] font-black text-white drop-shadow-sm">{percentage}%</span>
                </div>
              </div>
            </div>
            
          </div>
          
        </div>

        {/* Elegant Footer with Signatures */}
        <div className="mt-auto bg-slate-50/80 border-t border-slate-200 p-8 pt-10 flex justify-between items-end">
          
          <div className="text-center w-40">
            <div className="h-20 flex items-end justify-center mb-3 relative">
              {teacherSignatureUrl ? (
                <img src={teacherSignatureUrl} crossOrigin="anonymous" alt="Teacher Signature" className="max-h-16 object-contain mix-blend-multiply drop-shadow-sm" />
              ) : (
                <div className="text-blue-800/40 font-signature text-[24px] transform -rotate-12 italic" style={{ fontFamily: '"Brush Script MT", cursive' }}>Signature</div>
              )}
            </div>
            <div className="border-t-2 border-slate-300 pt-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Class Teacher</p>
            </div>
          </div>
          
          <div className="text-center w-40">
            <div className="h-20 flex items-end justify-center mb-3 relative">
              {principalSignatureUrl ? (
                <img src={principalSignatureUrl} crossOrigin="anonymous" alt="Principal Signature" className="max-h-16 object-contain mix-blend-multiply drop-shadow-sm" />
              ) : (
                <div className="text-indigo-800/40 font-signature text-[24px] transform -rotate-12 italic" style={{ fontFamily: '"Brush Script MT", cursive' }}>Signature</div>
              )}
            </div>
            <div className="border-t-2 border-slate-300 pt-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Principal</p>
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};
