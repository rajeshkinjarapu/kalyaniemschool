import React from 'react';
import { Award, User, Calendar, Phone, BookOpen, Layers } from 'lucide-react';

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
  let performanceColor = "text-red-600 border-red-600 bg-red-50";
  if (percentNumber >= 90) { performanceRating = "Outstanding"; performanceColor = "text-emerald-600 border-emerald-600 bg-emerald-50"; }
  else if (percentNumber >= 75) { performanceRating = "Excellent"; performanceColor = "text-green-600 border-green-600 bg-green-50"; }
  else if (percentNumber >= 60) { performanceRating = "Very Good"; performanceColor = "text-blue-600 border-blue-600 bg-blue-50"; }
  else if (percentNumber >= 40) { performanceRating = "Good"; performanceColor = "text-amber-600 border-amber-600 bg-amber-50"; }

  return (
    <div className="progress-card-wrapper w-[210mm] h-[297mm] overflow-hidden print:shadow-none print:m-0 mx-auto bg-white border border-gray-300 shadow-xl relative box-border flex flex-col" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always' }}>
      <div className="w-full h-full relative flex flex-col bg-white" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        
        {/* Formal Colorful Header */}
        <div className="border-b-[4px] border-amber-400 pb-4 pt-6 px-10 relative flex-shrink-0 flex items-center gap-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white">
          {/* Logo */}
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-white rounded-xl border-2 border-amber-400 p-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-[#1e2a5c] font-bold text-xl text-center leading-none flex items-center justify-center">
                LOGO
              </div>
            )}
          </div>
          
          <div className="flex-grow text-center">
            <h1 className="text-[28px] sm:text-[32px] font-black tracking-wide text-white mb-1 whitespace-nowrap drop-shadow-md" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              SRI VENKATESWARA JY SCHOOL
            </h1>
            <p className="text-[13px] font-bold tracking-[0.1em] text-amber-300 mb-3 uppercase drop-shadow-sm">
              (IIT-JEE / NEET Foundation • Olympiads)
            </p>
            <div className="inline-block border border-indigo-300 bg-indigo-50/20 text-white px-6 py-1.5 font-bold text-[14px] tracking-wider uppercase rounded-full shadow-sm">
              {exam?.name || 'EXAMINATION RESULT CARD'}
            </div>
          </div>
          
          {/* Decorative Right Element matching Logo width for balance */}
          <div className="w-24 flex-shrink-0 hidden sm:block text-right">
             <div className="w-16 h-16 ml-auto border-[3px] border-indigo-400/30 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-200/50 rotate-12">
               SEAL
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-10 flex flex-col gap-6 bg-white z-10">
          
          {/* Professional Student Details Table Row */}
          <div className="flex gap-6 items-start">
            <div className="flex-grow">
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 font-bold py-2 px-3 w-1/3 uppercase text-gray-700">Student Name</td>
                    <td className="border border-gray-400 font-bold py-2 px-3 uppercase text-gray-900">{data.studentName}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 font-bold py-2 px-3 uppercase text-gray-700">Student ID</td>
                    <td className="border border-gray-400 font-bold py-2 px-3 uppercase text-gray-900">{data.rollNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 font-bold py-2 px-3 uppercase text-gray-700">Class & Section</td>
                    <td className="border border-gray-400 font-bold py-2 px-3 uppercase text-gray-900">{data.className} - {data.section || 'A'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 font-bold py-2 px-3 uppercase text-gray-700">Academic Year</td>
                    <td className="border border-gray-400 font-bold py-2 px-3 uppercase text-gray-900">2026 - 2027</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 font-bold py-2 px-3 uppercase text-gray-700">Contact Number</td>
                    <td className="border border-gray-400 font-bold py-2 px-3 uppercase text-gray-900">{data.mobile || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 font-bold py-2 px-3 uppercase text-gray-700">Class Rank</td>
                    <td className="border border-gray-400 font-black py-2 px-3 uppercase text-[#1e2a5c]">#{data.rank || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Professional Passport Size Photo */}
            <div className="w-[120px] h-[150px] flex-shrink-0 border-2 border-gray-400 p-1 bg-white shadow-sm">
              <div className="w-full h-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {data.photo ? (
                  <img src={resolveUrl(data.photo)} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
            </div>
          </div>

          {/* Academic Performance Section */}
          <div className="mt-2">
            <h3 className="font-bold text-[#1e2a5c] text-[15px] tracking-widest uppercase border-b-2 border-[#1e2a5c] inline-block mb-3">Academic Performance Record</h3>
            
            <table className="w-full border-collapse border-2 border-gray-400 text-sm">
              <thead>
                <tr className="bg-[#1e2a5c] text-white">
                  <th className="border border-gray-400 py-2.5 px-4 text-left font-bold text-[12px] uppercase tracking-wider w-2/5">Subject</th>
                  <th className="border border-gray-400 py-2.5 px-4 text-center font-bold text-[12px] uppercase tracking-wider">Marks Obtained</th>
                  <th className="border border-gray-400 py-2.5 px-4 text-center font-bold text-[12px] uppercase tracking-wider">Max Marks</th>
                  <th className="border border-gray-400 py-2.5 px-4 text-center font-bold text-[12px] uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.marks.map((m: any, idx: number) => {
                  const subPercent = m.maxMarks ? ((m.obtained / m.maxMarks) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx}>
                      <td className="border border-gray-400 py-2.5 px-4 font-bold text-gray-800 text-[13px] uppercase">{m.subject}</td>
                      <td className="border border-gray-400 py-2.5 px-4 text-center font-bold text-gray-900 text-[13px]">{m.obtained}</td>
                      <td className="border border-gray-400 py-2.5 px-4 text-center font-semibold text-gray-600 text-[13px]">{m.maxMarks || 100}</td>
                      <td className="border border-gray-400 py-2.5 px-4 text-center font-bold text-gray-800 text-[13px]">{subPercent}%</td>
                    </tr>
                  );
                })}
                
                {/* Grand Total Row */}
                <tr className="bg-gray-100 border-t-2 border-t-gray-500">
                  <td className="border border-gray-400 py-3 px-4 font-black text-gray-900 text-[14px] uppercase tracking-wider text-right">Grand Total</td>
                  <td className="border border-gray-400 py-3 px-4 text-center font-black text-[#1e2a5c] text-lg">{totalObtained}</td>
                  <td className="border border-gray-400 py-3 px-4 text-center font-bold text-gray-700 text-[14px]">{totalMaxMarks}</td>
                  <td className="border border-gray-400 py-3 px-4 text-center font-black text-[#1fb981] text-lg">{percentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance Summary Details */}
          <div className="flex gap-6 mt-4">
            <div className="w-1/2 border border-gray-400 p-4">
               <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Overall Performance Grade</span>
               <div className={`inline-block border-2 px-6 py-2 ${performanceColor} font-black uppercase tracking-wider text-sm`}>
                 {performanceRating}
               </div>
            </div>
            
            <div className="w-1/2 border border-gray-400 p-4 flex flex-col justify-center">
              <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                <span>0</span>
                <span>Score Graph</span>
                <span>{totalMaxMarks}</span>
              </div>
              <div className="h-4 w-full border border-gray-300 bg-gray-100 flex p-0.5">
                <div 
                  className="h-full bg-[#1e2a5c]" 
                  style={{ width: `${percentNumber}%` }}
                ></div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer Area with Signatures - Kept at bottom */}
        <div className="w-full px-10 pb-16 pt-8 bg-white border-t border-gray-200 mt-auto">
          <div className="flex justify-between items-end">
            
            <div className="text-center w-48">
              <div className="h-16 flex items-end justify-center mb-2 relative">
                {teacherSignatureUrl ? (
                  <img src={teacherSignatureUrl} alt="Teacher Signature" className="max-h-14 object-contain mix-blend-multiply" />
                ) : (
                  <div className="text-blue-800/60 font-signature text-[22px] transform -rotate-12" style={{ fontFamily: '"Brush Script MT", cursive' }}>Signature</div>
                )}
              </div>
              <div className="border-t border-gray-800 pt-1">
                <p className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Class Teacher</p>
              </div>
            </div>
            
            {/* Authenticity Stamp / Note */}
            <div className="text-center pb-1">
               <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mx-auto mb-2 opacity-50">
                 <span className="text-[10px] font-bold text-gray-400 uppercase rotate-[-30deg] tracking-wider">Valid</span>
               </div>
               <p className="text-[9px] text-gray-400 uppercase tracking-wider">System Generated Result</p>
            </div>
            
            <div className="text-center w-48">
              <div className="h-16 flex items-end justify-center mb-2 relative">
                {principalSignatureUrl ? (
                  <img src={principalSignatureUrl} alt="Principal Signature" className="max-h-14 object-contain mix-blend-multiply" />
                ) : (
                  <div className="text-green-800/60 font-signature text-[22px] transform -rotate-12" style={{ fontFamily: '"Brush Script MT", cursive' }}>Signature</div>
                )}
              </div>
              <div className="border-t border-gray-800 pt-1">
                <p className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Principal</p>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
};
