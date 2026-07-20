import React from 'react';
import { User, Calendar, MapPin } from 'lucide-react';

interface AdmitCardTemplateProps {
  student: any;
  exam: any;
  examPlans: any[];
  className?: string;
  section?: string;
}

export const AdmitCardTemplate: React.FC<AdmitCardTemplateProps> = ({ student, exam, examPlans, className, section }) => {
  const settings = exam?.admitCardSettings || {};
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';
  
  // Resolve relative /uploads/ paths to the backend URL so images load correctly on Vercel
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const signatureUrl = resolveUrl(settings.signatureUrl || '');
  const logoUrl = resolveUrl(settings.logoUrl || '');

  return (
    <div className="admit-card-wrapper bg-white p-4 sm:p-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="w-full h-full border-4 border-indigo-800 rounded-3xl relative flex flex-col bg-white overflow-hidden shadow-sm">
        
        {/* Top Accent Bar */}
        <div className="h-3 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"></div>

        {/* Header - Colorful & Vibrant */}
        <div className="p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 border-b-4 border-amber-400 gap-4 sm:gap-0">
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-xl flex items-center justify-center shrink-0 border-2 border-amber-400 shadow-md p-2 sm:mr-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl font-black text-indigo-900">LOGO</span>
            )}
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-[20px] sm:text-[28px] lg:text-[36px] leading-tight font-black uppercase tracking-wide text-white mb-1 drop-shadow-md" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              SRI VENKATESWARA JY SCHOOL
            </h1>
            <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-amber-300 mb-2 drop-shadow-sm">
              (IIT-JEE/NEET Foundation – Olympiads)
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-indigo-100">
              <MapPin className="w-4 h-4 text-amber-400" />
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </div>
          </div>
          <div className="w-24 sm:w-28 shrink-0 hidden md:block"></div> {/* Spacer for centering */}
        </div>

        {/* Title Badge */}
        <div className="flex flex-col justify-center items-center -mt-6 relative z-10">
          <div className="bg-white border-2 border-amber-400 shadow-md rounded-full px-12 py-2 mb-3">
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-indigo-800">
              Admit Card
            </h2>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-indigo-950 uppercase tracking-widest text-center px-6 py-2 bg-indigo-50/80 rounded-xl border border-indigo-200 shadow-sm">
            {settings.examTitleOverride || `${exam?.name}`}
          </h3>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col gap-8 p-6 sm:p-8 mt-2">
          
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            
            {/* Student Info - True Tabular Form (One by One) */}
            <div className="flex-1 w-full bg-white border-2 border-indigo-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-indigo-600 px-5 py-2.5 border-b-2 border-indigo-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 drop-shadow-sm">
                  <User className="w-4 h-4 text-amber-300" /> Candidate Details
                </h3>
              </div>
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  <tr className="border-b border-indigo-100 hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider w-2/5 border-r border-indigo-100 bg-indigo-50/40">Candidate Name</td>
                    <td className="p-3 px-5 font-black text-indigo-950 text-base uppercase">
                      {student?.user?.name || student?.name}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100 hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-r border-indigo-100 bg-indigo-50/40">Roll Number</td>
                    <td className="p-3 px-5 font-bold text-indigo-900 text-base">
                      {student?.rollNo || 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100 hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-r border-indigo-100 bg-indigo-50/40">Class</td>
                    <td className="p-3 px-5 font-bold text-gray-800">
                      {className || student?.class?.name || student?.className || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100 hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-r border-indigo-100 bg-indigo-50/40">Section</td>
                    <td className="p-3 px-5 font-bold text-gray-800">
                      {section || student?.class?.section || student?.section || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100 hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-r border-indigo-100 bg-indigo-50/40">Gender</td>
                    <td className="p-3 px-5 font-bold text-gray-800">
                      {student?.gender || 'Male'}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100 hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-r border-indigo-100 bg-indigo-50/40">Date of Birth</td>
                    <td className="p-3 px-5 font-bold text-gray-800">
                      12/05/2010
                    </td>
                  </tr>
                  <tr className="hover:bg-indigo-50/50">
                    <td className="p-3 px-5 font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-r border-indigo-100 bg-indigo-50/40">Exam Center</td>
                    <td className="p-3 px-5 font-bold text-indigo-700">
                      {settings.examCenterOverride || 'JY School Main Campus, Hall A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo Area */}
            <div className="w-[120px] sm:w-[140px] mx-auto sm:mx-0 shrink-0 flex flex-col gap-3">
              <div className="w-full aspect-[3/4] border-2 border-indigo-200 rounded-xl flex flex-col items-center justify-center text-indigo-400 relative p-1.5 bg-indigo-50/50 shadow-inner overflow-hidden">
                {student?.user?.photoUrl ? (
                  <img src={student.user.photoUrl} alt="Student" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full border border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-center p-2 bg-white">
                    <User className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
                    <span className="text-[10px] uppercase font-bold leading-tight text-indigo-500">Affix<br/>Passport<br/>Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="bg-amber-400 p-1.5 rounded-md text-indigo-900 shadow-sm">
                <Calendar className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">
                Examination Schedule
              </h4>
            </div>
            <div className="border-2 border-indigo-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-indigo-600 text-white border-b-2 border-indigo-700">
                  <tr>
                    <th className="py-3 px-5 font-bold uppercase text-[11px] tracking-widest text-center w-14 border-r border-indigo-500/50">S.No</th>
                    <th className="py-3 px-5 font-bold uppercase text-[11px] tracking-widest border-r border-indigo-500/50">Date</th>
                    <th className="py-3 px-5 font-bold uppercase text-[11px] tracking-widest border-r border-indigo-500/50">Subject</th>
                    <th className="py-3 px-5 font-bold uppercase text-[11px] tracking-widest border-r border-indigo-500/50">Time</th>
                    <th className="py-3 px-5 font-bold uppercase text-[11px] tracking-widest text-center">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 bg-white">
                  {(settings.schedule?.length > 0 ? settings.schedule : examPlans)?.map((plan: any, i: number) => (
                    <tr key={plan.id || i} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="py-3 px-5 font-bold text-center text-indigo-400 border-r border-indigo-100">{i + 1}</td>
                      <td className="py-3 px-5 font-bold text-gray-700 border-r border-indigo-100">{plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-3 px-5 font-black text-indigo-950 border-r border-indigo-100">{plan.subject?.name || plan.subject}</td>
                      <td className="py-3 px-5 font-bold text-indigo-600 border-r border-indigo-100">{plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}`}</td>
                      <td className="py-3 px-5 text-center text-indigo-200">...............</td>
                    </tr>
                  ))}
                  {(!settings.schedule?.length && (!examPlans || examPlans.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-indigo-400 font-medium bg-indigo-50/30">No schedule mapped for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-4 mx-6 mb-6 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row justify-between gap-8 px-6">
          <div className="flex-1">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="bg-amber-500 w-2 h-2 rounded-full"></span> Important Instructions
            </h5>
            <ul className="text-[10.5px] text-gray-700 font-medium space-y-1.5 list-decimal pl-4 pr-4 text-justify leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
                <li key={idx} className="pl-1">{line}</li>
              ))}
            </ul>
          </div>
          <div className="text-center w-56 shrink-0 flex flex-col items-center justify-end">
            <div className="w-full h-20 flex items-end justify-center mb-2 border-b-2 border-indigo-200 border-dashed pb-1">
              {signatureUrl && <img src={signatureUrl} alt="Signature" className="h-16 object-contain" />}
            </div>
            <p className="text-[11px] uppercase font-black tracking-widest text-indigo-900">Principal Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
