import React from 'react';
import { Award, User, MapPin, Phone, GraduationCap, Trophy, CheckCircle2, Star, BookOpen } from 'lucide-react';

interface ProgressCardTemplateProps {
  data?: any;
  exam?: any;
  settings?: any;
}

export const ProgressCardTemplate: React.FC<ProgressCardTemplateProps> = ({ 
  data = {}, 
  exam = {}, 
  settings = {} 
}) => {
  // Fallback data for preview
  const safeData = {
    studentName: data.studentName || "VENKATA SAI KUMAR",
    rollNo: data.rollNo || "SVJY-2026-045",
    className: data.className || "Class X",
    section: data.section || "Olympiad Batch",
    mobile: data.mobile || "+91 9876543210",
    rank: data.rank || "1",
    photo: data.photo || "",
    marks: data.marks && data.marks.length > 0 ? data.marks : [
      { subject: "Mathematics", maxMarks: 100, obtained: 98 },
      { subject: "Physics", maxMarks: 100, obtained: 95 },
      { subject: "Chemistry", maxMarks: 100, obtained: 92 },
      { subject: "Biology", maxMarks: 100, obtained: 89 },
      { subject: "English", maxMarks: 100, obtained: 85 }
    ]
  };

  const totalMaxMarks = safeData.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
  const totalObtained = safeData.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
  const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : "0.0";
  const percentNumber = Number(percentage);

  const API_BASE = settings?.apiBase || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const logoUrl = resolveUrl(settings?.logoUrl); 
  const principalSignatureUrl = resolveUrl(settings?.signatureUrl || '');
  const teacherSignatureUrl = resolveUrl(settings?.teacherSignatureUrl || '');

  let performanceRating = "Needs Improvement";
  let performanceColor = "text-rose-600 border-rose-200 bg-rose-50";
  let progressColor = "from-rose-400 to-rose-600";
  let gradeLetter = "F";
  let gradeColor = "text-rose-600";
  
  if (percentNumber >= 90) { 
    performanceRating = "Outstanding"; 
    performanceColor = "text-emerald-700 border-emerald-200 bg-emerald-50"; 
    progressColor = "from-emerald-400 to-emerald-600";
    gradeLetter = "A+";
    gradeColor = "text-emerald-600";
  } else if (percentNumber >= 75) { 
    performanceRating = "Excellent"; 
    performanceColor = "text-blue-700 border-blue-200 bg-blue-50"; 
    progressColor = "from-blue-400 to-blue-600";
    gradeLetter = "A";
    gradeColor = "text-blue-600";
  } else if (percentNumber >= 60) { 
    performanceRating = "Very Good"; 
    performanceColor = "text-indigo-700 border-indigo-200 bg-indigo-50"; 
    progressColor = "from-indigo-400 to-indigo-600";
    gradeLetter = "B";
    gradeColor = "text-indigo-600";
  } else if (percentNumber >= 40) { 
    performanceRating = "Good"; 
    performanceColor = "text-amber-700 border-amber-200 bg-amber-50"; 
    progressColor = "from-amber-400 to-amber-600";
    gradeLetter = "C";
    gradeColor = "text-amber-600";
  }

  // Helper for subject grade
  const getSubjectGrade = (obtained: number, max: number) => {
    const p = (obtained / max) * 100;
    if (p >= 90) return { grade: "A+", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (p >= 80) return { grade: "A", color: "text-blue-600 bg-blue-50 border-blue-200" };
    if (p >= 70) return { grade: "B", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    if (p >= 50) return { grade: "C", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { grade: "D", color: "text-rose-600 bg-rose-50 border-rose-200" };
  };

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-[#f8f6f0] relative box-border flex flex-col shadow-2xl overflow-hidden print:shadow-none" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Decorative border */}
      <div className="absolute inset-0 border-[12px] border-[#1e2a4a] z-50 pointer-events-none rounded-sm"></div>
      <div className="absolute inset-0 border-[4px] border-[#c9a84c] z-40 pointer-events-none rounded-sm m-2"></div>

      {/* Subtle watermark background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#1e2a4a 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1e2a4a] rounded-full blur-[100px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9a84c] rounded-full blur-[100px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <div className="w-full h-full relative flex flex-col z-10 p-2 print:p-0">
        
        {/* ===== HEADER ===== */}
        <div className="bg-[#1e2a4a] rounded-t-xl overflow-hidden shadow-lg relative mx-2 mt-2">
          {/* Gold accent line */}
          <div className="h-2 w-full bg-gradient-to-r from-[#c9a84c] via-[#e8d5a3] to-[#c9a84c]"></div>
          
          <div className="px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] mix-blend-overlay"></div>
            
            {/* Logo */}
            <div className="w-24 h-24 shrink-0 bg-white p-2 rounded-full shadow-lg border-4 border-[#c9a84c]/30 flex items-center justify-center relative z-10">
              {logoUrl ? (
                <img src={logoUrl} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain rounded-full" />
              ) : (
                <GraduationCap className="w-12 h-12 text-[#1e2a4a]" />
              )}
            </div>
            
            {/* School Info */}
            <div className="flex-1 text-center relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-white uppercase mb-1 drop-shadow-md" style={{ fontFamily: '"Playfair Display", serif' }}>
                Sri Venkateswara JY School
              </h1>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-[1px] w-10 bg-[#c9a84c]/50"></div>
                <p className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#c9a84c] uppercase">
                  IIT-JEE • NEET • Olympiads
                </p>
                <div className="h-[1px] w-10 bg-[#c9a84c]/50"></div>
              </div>
              
              <div className="inline-flex items-center justify-center gap-2 text-[10px] font-medium bg-white/10 px-4 py-1.5 rounded-full text-white border border-white/10 backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-[#c9a84c]" />
                SVL Paradise Campus, Narasannapeta, AP
              </div>
            </div>
          </div>
        </div>

        {/* ===== EXAM TITLE BADGE ===== */}
        <div className="relative flex justify-center -mt-4 z-20">
          <div className="bg-gradient-to-r from-[#c9a84c] via-[#e8d5a3] to-[#c9a84c] text-[#1e2a4a] font-black px-8 py-2.5 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.4)] border-2 border-white text-sm sm:text-base tracking-[0.15em] uppercase">
            {exam?.name || 'Academic Progress Report'}
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-grow px-6 sm:px-10 py-8 flex flex-col gap-8">
          
          {/* ===== STUDENT INFO (Photo on Right) ===== */}
          <div className="flex flex-col sm:flex-row gap-6 items-stretch bg-white rounded-2xl shadow-md border border-[#e8e3d9] p-1">
            
            {/* Details - Left side */}
            <div className="flex-grow p-5 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 h-full content-center">
                <div className="col-span-1 md:col-span-2 border-b border-[#e8e3d9] pb-2">
                  <p className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest mb-1">Student Name</p>
                  <p className="text-lg sm:text-xl font-black text-[#1e2a4a] uppercase">{safeData.studentName}</p>
                </div>
                
                <div>
                  <p className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest mb-1">Roll No / ID</p>
                  <p className="text-sm font-bold text-[#1e2a4a] bg-[#f4f1ea] inline-block px-3 py-1 rounded-md border border-[#e8e3d9]">{safeData.rollNo}</p>
                </div>
                
                <div>
                  <p className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest mb-1">Class & Section</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1e2a4a] text-white px-2.5 py-0.5 rounded text-xs font-bold">{safeData.className}</span>
                    <span className="text-[#8a7f6e]">|</span>
                    <span className="font-semibold text-[#1e2a4a]">{safeData.section || 'A'}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest mb-1">Contact</p>
                  <p className="text-sm font-semibold text-[#1e2a4a] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8a7f6e]" />
                    {safeData.mobile || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-[#c9a84c] uppercase tracking-widest mb-1">Class Rank</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#c9a84c]/10 p-1.5 rounded-lg border border-[#c9a84c]/30">
                      <Trophy className="w-4 h-4 text-[#c9a84c]" />
                    </div>
                    <span className="text-xl font-black text-[#c9a84c]">#{safeData.rank || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo - Right side */}
            <div className="w-[140px] shrink-0 p-3 flex items-center justify-center">
              <div className="w-full aspect-[3/4] bg-[#f4f1ea] rounded-xl shadow-inner border-2 border-[#e8e3d9] overflow-hidden flex items-center justify-center relative">
                {safeData.photo ? (
                  <img src={resolveUrl(safeData.photo)} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <User className="w-12 h-12 text-[#bfb5a3]" />
                    <span className="text-[8px] font-bold text-[#bfb5a3] uppercase tracking-widest">Photo</span>
                  </div>
                )}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.08)] rounded-xl pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* ===== MARKS TABLE ===== */}
          <div>
            <div className="flex items-center gap-3 mb-4 pl-1">
              <div className="h-6 w-1.5 bg-[#1e2a4a] rounded-full"></div>
              <h3 className="font-bold text-[#1e2a4a] text-base uppercase tracking-widest">Scholastic Performance</h3>
            </div>
            
            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#e8e3d9]">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e2a4a] text-white">
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center w-14">#</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px]">Subject</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center w-24">Max</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center w-24">Obtained</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[10px] text-center w-24">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e3d9]">
                  {safeData.marks.map((m: any, idx: number) => {
                    const { grade, color } = getSubjectGrade(m.obtained, m.maxMarks || 100);
                    return (
                      <tr key={idx} className="hover:bg-[#faf8f5] transition-colors group">
                        <td className="py-3 px-4 text-center text-[#8a7f6e] font-medium text-xs">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="py-3 px-4 font-bold text-[#1e2a4a] group-hover:text-[#c9a84c] transition-colors">{m.subject}</td>
                        <td className="py-3 px-4 text-center text-[#8a7f6e] font-medium">{m.maxMarks || 100}</td>
                        <td className="py-3 px-4 text-center font-black text-[#1e2a4a] text-base">{m.obtained}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${color}`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== SUMMARY ===== */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* Grand Total & Percentage */}
            <div className="col-span-12 sm:col-span-6 bg-gradient-to-br from-[#1e2a4a] to-[#2a3d6e] rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#c9a84c] opacity-10 rounded-full blur-xl translate-x-1/2 translate-y-1/2"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[9px] font-bold text-[#a8b5d4] uppercase tracking-widest block">Grand Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{totalObtained}</span>
                    <span className="text-sm font-medium text-[#a8b5d4]">/ {totalMaxMarks}</span>
                  </div>
                </div>
                
                <div className="hidden sm:block h-14 w-[1px] bg-white/10"></div>
                
                <div className="text-center sm:text-right">
                  <span className="text-[9px] font-bold text-[#c9a84c] uppercase tracking-widest block">Percentage</span>
                  <div className="flex items-baseline justify-center sm:justify-end gap-0.5">
                    <span className="text-3xl font-black text-white">{percentage}</span>
                    <span className="text-sm font-bold text-[#c9a84c]">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade & Performance */}
            <div className="col-span-6 sm:col-span-3 bg-white rounded-2xl p-4 shadow-md border border-[#e8e3d9] flex flex-col justify-center items-center">
              <span className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest mb-1">Final Grade</span>
              <span className={`text-4xl font-black ${gradeColor} mb-1`}>{gradeLetter}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full ${performanceColor}`}>
                {performanceRating}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="col-span-6 sm:col-span-3 bg-white rounded-2xl p-4 shadow-md border border-[#e8e3d9] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest">Score Graph</span>
                <CheckCircle2 className={`w-4 h-4 ${percentNumber >= 50 ? 'text-emerald-500' : 'text-[#bfb5a3]'}`} />
              </div>
              <div className="h-3 w-full bg-[#f4f1ea] rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.max(5, percentNumber)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1.5 text-[8px] font-bold text-[#bfb5a3]">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-auto bg-white border-t border-[#e8e3d9] p-6 mx-2 mb-2 rounded-b-xl shadow-inner">
          
          {/* Grading Legend */}
          <div className="flex justify-center gap-3 sm:gap-6 mb-6 flex-wrap">
            <div className="text-[8px] text-[#8a7f6e] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> A+: 90-100
            </div>
            <div className="text-[8px] text-[#8a7f6e] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> A: 80-89
            </div>
            <div className="text-[8px] text-[#8a7f6e] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> B: 60-79
            </div>
            <div className="text-[8px] text-[#8a7f6e] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> C: 40-59
            </div>
            <div className="text-[8px] text-[#8a7f6e] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> D: Below 40
            </div>
          </div>

          <div className="flex justify-between items-end px-4 sm:px-8">
            
            {/* Teacher Signature */}
            <div className="flex flex-col items-center w-32">
              <div className="h-12 flex items-end justify-center mb-2 w-full relative">
                {teacherSignatureUrl ? (
                  <img src={teacherSignatureUrl} crossOrigin="anonymous" alt="Teacher" className="max-h-12 object-contain mix-blend-multiply" />
                ) : (
                  <div className="w-full border-b-2 border-[#e8e3d9] border-dashed mb-1"></div>
                )}
              </div>
              <p className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest text-center">Class Teacher</p>
            </div>
            
            {/* School Seal */}
            <div className="flex flex-col items-center justify-center pb-2">
               <div className="w-14 h-14 rounded-full border-2 border-[#c9a84c]/30 flex items-center justify-center bg-[#faf8f5] shadow-sm">
                  <span className="text-[7px] font-bold text-[#c9a84c] uppercase text-center leading-tight">School<br/>Seal</span>
               </div>
            </div>
            
            {/* Principal Signature */}
            <div className="flex flex-col items-center w-32">
              <div className="h-12 flex items-end justify-center mb-2 w-full relative">
                {principalSignatureUrl ? (
                  <img src={principalSignatureUrl} crossOrigin="anonymous" alt="Principal" className="max-h-12 object-contain mix-blend-multiply" />
                ) : (
                  <div className="w-full border-b-2 border-[#e8e3d9] border-dashed mb-1"></div>
                )}
              </div>
              <p className="text-[9px] font-bold text-[#8a7f6e] uppercase tracking-widest text-center">Principal</p>
            </div>
            
          </div>
          
          <div className="text-center mt-6">
             <p className="text-[7px] text-[#bfb5a3] font-medium uppercase tracking-widest">System Generated Report • Not valid without authorized signatures</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProgressCardTemplate;
