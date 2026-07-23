import React from 'react';
import { User, MapPin, Phone, GraduationCap, Trophy, CheckCircle2, Award } from 'lucide-react';

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
  let performanceColor = "bg-rose-100 text-rose-700 border-rose-200";
  let progressColor = "from-rose-500 to-pink-500";
  let gradeLetter = "F";
  let gradeColor = "text-rose-600";
  
  if (percentNumber >= 90) { 
    performanceRating = "Outstanding"; 
    performanceColor = "bg-emerald-100 text-emerald-700 border-emerald-200"; 
    progressColor = "from-emerald-400 to-teal-500";
    gradeLetter = "A+";
    gradeColor = "text-emerald-500";
  } else if (percentNumber >= 75) { 
    performanceRating = "Excellent"; 
    performanceColor = "bg-blue-100 text-blue-700 border-blue-200"; 
    progressColor = "from-blue-400 to-indigo-500";
    gradeLetter = "A";
    gradeColor = "text-blue-500";
  } else if (percentNumber >= 60) { 
    performanceRating = "Very Good"; 
    performanceColor = "bg-purple-100 text-purple-700 border-purple-200"; 
    progressColor = "from-purple-400 to-fuchsia-500";
    gradeLetter = "B";
    gradeColor = "text-purple-500";
  } else if (percentNumber >= 40) { 
    performanceRating = "Good"; 
    performanceColor = "bg-amber-100 text-amber-700 border-amber-200"; 
    progressColor = "from-amber-400 to-orange-500";
    gradeLetter = "C";
    gradeColor = "text-amber-500";
  }

  const getSubjectGrade = (obtained: number, max: number) => {
    const p = (obtained / max) * 100;
    if (p >= 90) return { grade: "A+", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (p >= 80) return { grade: "A", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (p >= 70) return { grade: "B", color: "bg-purple-100 text-purple-700 border-purple-200" };
    if (p >= 50) return { grade: "C", color: "bg-amber-100 text-amber-700 border-amber-200" };
    return { grade: "D", color: "bg-rose-100 text-rose-700 border-rose-200" };
  };

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white relative box-border flex flex-col shadow-2xl overflow-hidden print:shadow-none font-sans" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always' }}>
      
      {/* ===== VIBRANT BACKGROUND BLOBS ===== */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-gradient-to-tl from-pink-500/20 to-orange-400/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[20%] bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      
      {/* Decorative Border */}
      <div className="absolute inset-0 border-[8px] border-transparent pointer-events-none z-50 rounded-lg" style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #6366f1, #ec4899, #eab308) border-box' }}></div>

      <div className="w-full h-full relative flex flex-col z-10 p-4 print:p-2">
        
        {/* ===== VIBRANT HEADER ===== */}
        <div className="rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(99,102,241,0.2)] relative mt-2 mx-2 border border-white/50 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            {/* Logo */}
            <div className="w-28 h-28 shrink-0 bg-white p-2 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center relative border-[3px] border-white/80">
              {logoUrl ? (
                <img src={logoUrl} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain rounded-full" />
              ) : (
                <GraduationCap className="w-14 h-14 text-fuchsia-600" />
              )}
            </div>
            
            {/* School Info */}
            <div className="flex-1 text-center relative z-10">
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                SRI VENKATESWARA JY SCHOOL
              </h1>
              <div className="inline-block bg-white/20 backdrop-blur-md px-6 py-1.5 rounded-full border border-white/30 shadow-inner mb-3">
                <p className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white uppercase drop-shadow-md">
                  IIT-JEE • NEET • Olympiads
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/90">
                <MapPin className="w-3.5 h-3.5 text-rose-200" />
                <span className="tracking-wide">SVL Paradise Campus, Narasannapeta, AP</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== EXAM TITLE BADGE ===== */}
        <div className="relative flex justify-center -mt-5 z-20">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-10 py-3 rounded-full shadow-[0_8px_25px_rgba(245,158,11,0.5)] border-4 border-white text-sm sm:text-base tracking-[0.2em] uppercase transform transition-transform hover:scale-105">
            {exam?.name || 'Academic Progress Report'}
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-grow px-4 sm:px-8 py-8 flex flex-col gap-6">
          
          {/* ===== COLORFUL STUDENT INFO ===== */}
          <div className="flex flex-col sm:flex-row gap-6 items-stretch bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white p-3 relative overflow-hidden">
            {/* Glossy highlight */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none"></div>

            {/* Details */}
            <div className="flex-grow p-4 pr-2 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6 h-full content-center">
                
                <div className="col-span-1 md:col-span-2">
                  <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest mb-1.5">Student Name</div>
                  <p className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">{safeData.studentName}</p>
                </div>
                
                <div>
                  <div className="inline-block px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Roll No / ID</div>
                  <p className="text-base font-bold text-gray-800">{safeData.rollNo}</p>
                </div>
                
                <div>
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Class & Section</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-base">{safeData.className}</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{safeData.section || 'A'}</span>
                  </div>
                </div>

                <div>
                  <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Contact</div>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    {safeData.mobile || 'N/A'}
                  </p>
                </div>

                <div>
                  <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Class Rank</div>
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1.5 rounded-xl text-purple-600 shadow-inner">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">#{safeData.rank || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo */}
            <div className="w-[150px] shrink-0 p-2 flex items-center justify-center relative z-10">
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-[0_8px_20px_rgba(99,102,241,0.15)] border-4 border-white overflow-hidden flex items-center justify-center relative group">
                {safeData.photo ? (
                  <img src={resolveUrl(safeData.photo)} alt="Student" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <User className="w-14 h-14 text-indigo-300" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== VIBRANT MARKS TABLE ===== */}
          <div>
            <div className="flex items-center gap-3 mb-4 pl-2">
              <Award className="w-6 h-6 text-fuchsia-500" />
              <h3 className="font-black text-gray-800 text-lg uppercase tracking-wider">Scholastic Performance</h3>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-white">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <th className="py-4 px-5 font-black uppercase tracking-widest text-[11px] text-center w-16">#</th>
                    <th className="py-4 px-5 font-black uppercase tracking-widest text-[11px]">Subject</th>
                    <th className="py-4 px-5 font-black uppercase tracking-widest text-[11px] text-center w-28">Max</th>
                    <th className="py-4 px-5 font-black uppercase tracking-widest text-[11px] text-center w-28">Obtained</th>
                    <th className="py-4 px-5 font-black uppercase tracking-widest text-[11px] text-center w-28">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {safeData.marks.map((m: any, idx: number) => {
                    const { grade, color } = getSubjectGrade(m.obtained, m.maxMarks || 100);
                    return (
                      <tr key={idx} className="hover:bg-indigo-50/50 transition-colors bg-white/40">
                        <td className="py-3.5 px-5 text-center text-gray-400 font-bold text-xs">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="py-3.5 px-5 font-bold text-gray-700 text-base">{m.subject}</td>
                        <td className="py-3.5 px-5 text-center text-gray-500 font-semibold">{m.maxMarks || 100}</td>
                        <td className="py-3.5 px-5 text-center font-black text-gray-800 text-lg">{m.obtained}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm shadow-sm border ${color}`}>
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

          {/* ===== COLORFUL SUMMARY ===== */}
          <div className="grid grid-cols-12 gap-5 mt-2">
            
            {/* Grand Total & Percentage */}
            <div className="col-span-12 md:col-span-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-[0_10px_30px_rgba(147,51,234,0.3)] relative overflow-hidden flex flex-col justify-center border border-white/20">
              {/* Glass decorative circles */}
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-cyan-400/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="text-center sm:text-left bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 w-full sm:w-auto flex-1">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-1">Grand Total</span>
                  <div className="flex items-baseline justify-center sm:justify-start gap-1">
                    <span className="text-4xl font-black text-white drop-shadow-md">{totalObtained}</span>
                    <span className="text-sm font-bold text-indigo-200">/ {totalMaxMarks}</span>
                  </div>
                </div>
                
                <div className="hidden sm:block h-16 w-[2px] bg-white/20 rounded-full"></div>
                
                <div className="text-center sm:text-right bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 w-full sm:w-auto shadow-inner flex-1">
                  <span className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest block mb-1">Percentage</span>
                  <div className="flex items-baseline justify-center sm:justify-end gap-0.5">
                    <span className="text-4xl font-black text-white drop-shadow-md">{percentage}</span>
                    <span className="text-lg font-bold text-fuchsia-300">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade & Performance */}
            <div className="col-span-6 md:col-span-3 bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Final Grade</span>
              <span className={`text-5xl font-black ${gradeColor} mb-3 drop-shadow-sm`}>{gradeLetter}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border shadow-sm ${performanceColor}`}>
                {performanceRating}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="col-span-6 md:col-span-3 bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white flex flex-col justify-center relative overflow-hidden">
               <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-400"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score Graph</span>
                <div className="p-1.5 bg-gray-50 rounded-lg shadow-inner">
                  <CheckCircle2 className={`w-5 h-5 ${percentNumber >= 50 ? 'text-emerald-500' : 'text-gray-300'}`} />
                </div>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200/50">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}
                  style={{ width: `${Math.max(5, percentNumber)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-auto bg-white/90 backdrop-blur-lg border-t-2 border-indigo-50 p-6 mx-4 mb-4 rounded-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.03)]">
          
          {/* Grading Legend */}
          <div className="flex justify-center gap-3 sm:gap-6 mb-8 flex-wrap">
            {[
              { label: 'A+: 90-100', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'A: 80-89', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'B: 60-79', color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
              { label: 'C: 40-59', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'D: Below 40', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' }
            ].map((g, i) => (
              <div key={i} className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-lg ${g.bg} ${g.text} border border-white shadow-sm`}>
                <span className={`w-2.5 h-2.5 rounded-full shadow-inner ${g.color}`}></span> {g.label}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end px-4 sm:px-8 relative">
            
            {/* Teacher Signature */}
            <div className="flex flex-col items-center w-36 z-10">
              <div className="h-14 flex items-end justify-center mb-3 w-full relative">
                {teacherSignatureUrl ? (
                  <img src={teacherSignatureUrl} crossOrigin="anonymous" alt="Teacher" className="max-h-14 object-contain mix-blend-multiply" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                ) : (
                  <div className="w-full border-b-2 border-gray-300 border-dashed mb-1"></div>
                )}
              </div>
              <div className="bg-gray-100/80 px-4 py-1.5 rounded-full border border-gray-200">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Class Teacher</p>
              </div>
            </div>
            
            {/* School Seal */}
            <div className="flex flex-col items-center justify-center pb-2 absolute left-1/2 transform -translate-x-1/2 bottom-0 z-0">
               <div className="w-20 h-20 rounded-full border-4 border-indigo-100 flex flex-col items-center justify-center bg-white shadow-[0_5px_15px_rgba(99,102,241,0.15)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-purple-50 opacity-50"></div>
                  <Award className="w-6 h-6 text-indigo-300 mb-0.5" />
                  <span className="text-[7px] font-black text-indigo-400 uppercase text-center leading-tight tracking-wider z-10">Official<br/>Seal</span>
               </div>
            </div>
            
            {/* Principal Signature */}
            <div className="flex flex-col items-center w-36 z-10">
              <div className="h-14 flex items-end justify-center mb-3 w-full relative">
                {principalSignatureUrl ? (
                  <img src={principalSignatureUrl} crossOrigin="anonymous" alt="Principal" className="max-h-14 object-contain mix-blend-multiply" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                ) : (
                  <div className="w-full border-b-2 border-gray-300 border-dashed mb-1"></div>
                )}
              </div>
              <div className="bg-gray-100/80 px-4 py-1.5 rounded-full border border-gray-200">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Principal</p>
              </div>
            </div>
            
          </div>
          
          <div className="text-center mt-8 pt-4 border-t border-gray-100">
             <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 inline-block px-4 py-1 rounded-full border border-gray-100">
               System Generated Report • Not valid without authorized signatures
             </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProgressCardTemplate;
